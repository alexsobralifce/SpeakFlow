// apps/web/server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const OpenAI = require('openai');
const { buildMasterTeacherPrompt } = require('./prompts/master_teacher_prompt');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

require('dotenv').config({ path: '.env.local' });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build',
});

const hasGoogle = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
let speechClient = null;
let ttsClient = null;
if (hasGoogle) {
  try {
    speechClient = new speech.SpeechClient();
    ttsClient = new textToSpeech.TextToSpeechClient();
  } catch (e) {
    console.log('Skipping Google Cloud client init');
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    let recognizeStream = null;
    let sessionHistory = [];
    let sessionLevel = 'beginner';
    let sessionScenario = 'General Chat';
    let sessionMode = 'practice'; // 'practice' or 'onboarding'
    let sessionSettings = { subtitlesPt: false, suggestionsEnabled: false, pronunciationMode: false };
    let sessionProfile = null; // populated after onboarding completes
    let waitingForUser = false;


    // Timer handles
    let sessionTimeout = null;
    const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

    socket.on('start_session', async (config) => {
      sessionLevel = config.level || sessionLevel;
      sessionScenario = config.scenario || sessionScenario;
      sessionSettings = config.settings || sessionSettings;
      sessionMode = config.mode || 'practice';
      if (config.profile) sessionProfile = config.profile; // restore profile if passed on reconnect
      sessionHistory = [];
      console.log('[Session] Settings:', sessionSettings);

      console.log(`[Session] Started. Mode: ${sessionMode}. Level: ${sessionLevel}. Scenario: ${sessionScenario}`);

      sessionTimeout = setTimeout(() => {
        console.log(`[Session] 10m limit reached for ${socket.id}`);
        socket.emit('session_timeout', { message: 'Time is up! Great job today.' });
        if (recognizeStream) {
          recognizeStream.end();
        }
      }, SESSION_DURATION_MS);

      // For onboarding, use the fixed greeting; for practice, generate a rich opening with the AI
      let greeting;
      let greetingPt;

      if (sessionMode === 'onboarding') {
        greeting = "Olá! 👋 Que bom ter você aqui! Antes de começar, vou te fazer algumas perguntas rápidas para personalizar suas sessões de inglês. Pode responder à vontade — não tem certo ou errado! Vamos começar: qual é o seu nome?";
      } else {
        // Generate a rich, teacher-style opening using the AI
        const openingPrompt = [
          {
            role: 'system',
            content: `You are an experienced English teacher. Your student (${sessionLevel} level) has chosen the topic: "${sessionScenario}".
Write a warm, engaging opening message that:
1. Welcomes the student and names the topic clearly.
2. Lists 3-4 specific sub-topics or vocabulary areas you will explore in this session (as a brief overview, not a list of questions).
3. Immediately asks the FIRST question to kick off the conversation — a natural, open-ended question tied to the topic and appropriate for a ${sessionLevel} student.
Keep the tone friendly and encouraging. Max 5 sentences total. Speak in English only.`
          },
          { role: 'user', content: 'Begin the session.' }
        ];

        const openingCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: openingPrompt,
          max_tokens: 200,
        });

        greeting = openingCompletion.choices[0].message.content ||
          `Great choice! Today we're going to practice "${sessionScenario}". Let's dive in — tell me, how familiar are you with this topic?`;

        // If PT subtitles are on, translate the generated greeting too
        if (sessionSettings.subtitlesPt) {
          const translationCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'Translate the following English text to natural, colloquial Brazilian Portuguese (PT-BR). Return only the translation, no explanations.' },
              { role: 'user', content: greeting }
            ],
            max_tokens: 250,
          });
          greetingPt = translationCompletion.choices[0].message.content || undefined;
        }
      }

      try {
        if (ttsClient) {
          const [resp] = await ttsClient.synthesizeSpeech({
            input: { text: greeting },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          socket.emit('ai_reply_audio', { audioBase64: resp.audioContent.toString('base64'), text: greeting, textPt: greetingPt });
        } else {
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: greeting,
          });
          const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          socket.emit('ai_reply_audio', { audioBase64: ttsBuffer.toString('base64'), text: greeting, textPt: greetingPt });
        }
      } catch (err) {
        console.error(err);
      }

      waitingForUser = true; // AI just gave the intro, now we wait for user
    });


    socket.on('start_recognition_stream', () => {
      if (!speechClient) return; // Silent fallback: frontend will send full audio later

      recognizeStream = speechClient
        .streamingRecognize({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
          },
          interimResults: true,
        })
        .on('error', console.error)
        .on('data', data => {
          const result = data.results[0];
          if (result) {
            const transcript = result.alternatives[0].transcript;
            socket.emit('transcription_update', {
              text: transcript,
              isFinal: result.isFinal
            });

            if (result.isFinal) {
              processTurn(transcript);
            }
          }
        });
    });

    socket.on('audio_data', (data) => {
      if (recognizeStream && !recognizeStream.destroyed) {
        recognizeStream.write(data);
      }
    });

    socket.on('stop_recognition_stream', () => {
      if (recognizeStream) {
        recognizeStream.end();
        recognizeStream = null;
      }
    });

    socket.on('text_message', (text) => {
      if (text) {
        processTurn(text);
      }
    });

    // Fallback: receive the entire webm audio file to process via OpenAI Whisper
    socket.on('process_audio_file', async (arrayBuffer) => {
      try {
        socket.emit('ai_thinking', true);
        const fs = require('fs');
        const os = require('os');
        const path = require('path');
        const tempFilePath = path.join(os.tmpdir(), `audio-${socket.id}-${Date.now()}.webm`);
        fs.writeFileSync(tempFilePath, Buffer.from(arrayBuffer));

        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: 'whisper-1',
          language: 'en',
        });

        fs.unlinkSync(tempFilePath);

        if (transcription.text) {
          socket.emit('transcription_update', {
            text: transcription.text,
            isFinal: true,
            source: 'whisper'
          });
          processTurn(transcription.text);
        } else {
          socket.emit('ai_thinking', false);
        }
      } catch (err) {
        console.error('Whisper STT Error:', err);
        socket.emit('ai_thinking', false);
      }
    });

    socket.on('disconnect', () => {
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (recognizeStream) recognizeStream.end();
      console.log('[Socket] Client disconnected');
    });

    socket.on('nudge_requested', async () => {
      if (!waitingForUser) return; // Only nudge if we are actually waiting for the user

      const nudgeMessages = [
        "Hey, still there? 😊 Take your time — no pressure!",
        "No worries! Whenever you're ready, I'm here to practice with you.",
        "It's okay to think before you speak — that's actually great practice!",
      ];
      const nudge = nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)];

      try {
        if (ttsClient) {
          const [resp] = await ttsClient.synthesizeSpeech({
            input: { text: nudge },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          socket.emit('ai_reply_audio', { audioBase64: resp.audioContent.toString('base64'), text: nudge });
        } else {
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: nudge,
          });
          const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          socket.emit('ai_reply_audio', { audioBase64: ttsBuffer.toString('base64'), text: nudge });
        }
      } catch (err) {
        console.error('Nudge TTS Error:', err);
      }
    });

    async function processTurn(userText) {
      if (waitingForUser && !userText) return; // Ignore empty double triggers
      waitingForUser = false; // User replied, AI starts processing

      try {
        socket.emit('ai_thinking', true);

        const sysPrompt = sessionMode === 'onboarding'
          ? buildOnboardingPrompt()
          : buildMasterTeacherPrompt({
            level: sessionLevel,
            scenario: sessionScenario,
            settings: sessionSettings,
            profile: sessionProfile ?? null,
          });

        const msgs = [
          { role: 'system', content: sysPrompt },
          ...sessionHistory,
          { role: 'user', content: userText }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: msgs,
          response_format: { type: 'json_object' },
          max_tokens: 1200,
        });

        let parsed = {};
        try {
          parsed = JSON.parse(completion.choices[0].message.content || '{}');
        } catch (parseErr) {
          console.error('[processTurn] JSON parse failed, finish_reason:', completion.choices[0].finish_reason, parseErr.message);
          // Fallback: send a safe reply so the session doesn't freeze
          parsed = { reply: "I'm here! Could you say that again? I want to make sure I understand you correctly." };
        }
        const aiReplyText = parsed.reply || "I'm sorry, I didn't quite get that — could you try speaking again, a bit slower? I'm here and listening!";
        const aiReplyPt = parsed.reply_pt || undefined;
        const corrections = parsed.corrections || [];
        const pronunciationTips = parsed.pronunciation_tips || [];
        const suggestions = parsed.suggestions || [];
        const sessionClosing = parsed.session_closing || null;
        const profileResponse = parsed.profile || null;

        // Persist onboarding profile once the AI emits it
        if (profileResponse && sessionMode === 'onboarding') {
          sessionProfile = profileResponse;
          console.log('[Session] Onboarding profile saved for:', sessionProfile.full_name);
        }

        // Save to history
        sessionHistory.push({ role: 'user', content: userText });
        sessionHistory.push({ role: 'assistant', content: aiReplyText });

        // Send text metadata
        socket.emit('ai_reply_text', {
          text: aiReplyText,
          textPt: aiReplyPt,
          corrections,
          pronunciationTips,
          suggestions,
          sessionClosing,
          profile: profileResponse,
        });

        // TTS
        if (ttsClient) {
          const [resp] = await ttsClient.synthesizeSpeech({
            input: { text: aiReplyText },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          socket.emit('ai_reply_audio', { audioBase64: resp.audioContent.toString('base64'), text: aiReplyText, textPt: aiReplyPt, suggestions });
        } else {
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: aiReplyText,
          });
          const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          socket.emit('ai_reply_audio', { audioBase64: ttsBuffer.toString('base64'), text: aiReplyText, textPt: aiReplyPt, suggestions });
        }
        waitingForUser = true;
      } catch (e) {
        console.error('Process Turn Error:', e);
      } finally {
        socket.emit('ai_thinking', false);
      }
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`> Port ${port} is already in use. Another server is running — skipping startup.`);
      process.exit(0);
    } else {
      throw err;
    }
  });
});

// buildPrompt() has been replaced by buildMasterTeacherPrompt() from ./prompts/master_teacher_prompt.js

function buildOnboardingPrompt() {
  return `You are a friendly English specialist conducting a short, smart onboarding for SpeakFlow.
Your goal is to ask EXACTLY 5 questions in Portuguese to understand the user's English learning goals and context.
Then generate a clean profile JSON.

===========================================================
## THE 5 QUESTIONS — Ask in this exact order, ONE per message
===========================================================

QUESTION 1 — Name + Main Goal
Ask: "Olá! Tudo bem? 😊 Para começar, pode me dizer seu nome e me contar qual é o seu principal objetivo com o inglês? (ex: trabalho, viagem, imigração, entretenimento, estudo no exterior...)"
Collect: { full_name, main_goal }

QUESTION 2 — Current Level + Biggest Challenge
Ask: "Que bom, [first_name]! Me conta: você já estudou inglês antes? Se sim, por quanto tempo? E qual é a maior dificuldade que você sente hoje — vocabulário, pronúncia, gramática, falar com fluência ou confiança para se expressar?"
Collect: { english_study_time, biggest_difficulty }

QUESTION 3 — Professional / Study Context
Ask: "Entendido! E no dia a dia, você usa ou precisa usar o inglês no trabalho ou nos estudos? Me diz sua profissão ou área — e se você tem colegas, clientes ou aulas em inglês."
Collect: { profession, work_sector, uses_english_at_work, has_international_colleagues }

QUESTION 4 — Interests (choose topics for sessions)
Ask: "Show! Agora a parte divertida 🎉 — quais assuntos você mais curte fora do trabalho? Pode ser séries, filmes, esportes, tecnologia, viagens, música... Quanto mais você me contar, mais personalizadas ficam suas sessões!"
Collect: { interests: string[] }  // free-form list of interests

QUESTION 5 — Learning Style + Goal
Ask: "Última pergunta, prometo! 😄 Como você aprende melhor: prefere ir no seu ritmo com conteúdo progressivo, ou gosta de ser desafiado desde o início? E em 1 frase: qual seria seu sonho de inglês — o que você quer conseguir fazer quando estiver fluente?"
Collect: { learning_style: 'gradual' | 'challenged', dream_goal: string }

===========================================================
## CONVERSATION RULES
===========================================================
- Respond ENTIRELY in Portuguese (PT-BR).
- Ask ONLY ONE question per message. Wait for the user's answer.
- Be warm, human and encouraging — never robotic.
- If the user gives a vague answer, ask ONE brief follow-up, then move on.
- Infer the user's first name from Question 1 and use it naturally in subsequent messages.
- After Question 5 is answered, thank the user warmly, tell them their profile is ready and the AI is calibrated for them.

===========================================================
## PROFILE JSON — Emit ONLY after all 5 answers are collected
===========================================================
You MUST return a valid JSON on EVERY message with this structure:

{
  "reply": "Your warm conversational Portuguese text, ending with the NEXT question if the profile is not yet complete.",
  "profile": null
}

ONLY replace "profile": null with the actual profile object after all 5 questions are answered:

{
  "reply": "Your closing warm message in Portuguese.",
  "profile": {
    "full_name": "",
    "main_goal": "",
    "english_study_time": "",
    "biggest_difficulty": "",
    "profession": "",
    "work_sector": "",
    "uses_english_at_work": "",
    "has_international_colleagues": false,
    "interests": [],
    "learning_style": "",
    "dream_goal": ""
  }
}

IMPORTANT: Do NOT emit the profile object before all 5 questions are answered.
`;
}

