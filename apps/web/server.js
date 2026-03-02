// apps/web/server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const OpenAI = require('openai');

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

    // Timer handles
    let sessionTimeout = null;
    const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

    socket.on('start_session', async (config) => {
      sessionLevel = config.level || sessionLevel;
      sessionScenario = config.scenario || sessionScenario;
      sessionSettings = config.settings || sessionSettings;
      sessionMode = config.mode || 'practice';
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

      const greeting = sessionMode === 'onboarding'
        ? "Olá! 👋 Que bom ter você aqui! Antes de começar, vou te fazer algumas perguntas rápidas para personalizar suas sessões de inglês. Pode responder à vontade — não tem certo ou errado! Vamos começar: qual é o seu nome?"
        : `Hello! We have 10 minutes to practice. What topic would you like to study today?`;

      try {
        if (ttsClient) {
          const [resp] = await ttsClient.synthesizeSpeech({
            input: { text: greeting },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          socket.emit('ai_reply_audio', { audioBase64: resp.audioContent.toString('base64'), text: greeting });
        } else {
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: greeting,
          });
          const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          const greetingPt = sessionSettings.subtitlesPt ? 'Olá! Temos 10 minutos para praticar. Qual tema você gostaria de estudar hoje?' : undefined;
          socket.emit('ai_reply_audio', { audioBase64: ttsBuffer.toString('base64'), text: greeting, textPt: greetingPt });
        }
      } catch (err) {
        console.error(err);
      }
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
            isFinal: true
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

    async function processTurn(userText) {
      try {
        socket.emit('ai_thinking', true);

        const sysPrompt = sessionMode === 'onboarding'
          ? buildOnboardingPrompt()
          : buildPrompt(sessionLevel, sessionScenario, sessionSettings);

        const msgs = [
          { role: 'system', content: sysPrompt },
          ...sessionHistory,
          { role: 'user', content: userText }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: msgs,
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(completion.choices[0].message.content || '{}');
        const aiReplyText = parsed.reply || "I didn't quite catch that.";
        const aiReplyPt = parsed.reply_pt || undefined;
        const corrections = parsed.corrections || [];
        const pronunciationTips = parsed.pronunciation_tips || [];
        const suggestions = parsed.suggestions || [];
        const sessionClosing = parsed.session_closing || null;
        const profileResponse = parsed.profile || null;

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

function buildPrompt(level, scenario, settings = {}) {
  const extraFields = [];

  if (settings.subtitlesPt) {
    extraFields.push('  "reply_pt": "Tradução em português BR do campo reply, natural e coloquial"');
  }

  if (settings.suggestionsEnabled) {
    extraFields.push('  "suggestions": [{"text": "uma frase completa em inglês que o aluno poderia dizer como resposta"}]');
  }

  if (settings.pronunciationMode) {
    extraFields.push('  "pronunciation_tips": [{"word": "palavra", "phonetic": "/fonetik/", "tip": "dica em PT-BR de como pronunciar"}]');
  }

  const schemaFields = [
    '  "reply": "The natural English text you speak back to the user"',
    '  "corrections": [{"original": "", "corrected": "", "rule": "PT-BR explanation (max 2 lines)"}]',
    '  "session_closing": null // Or an object {"strengths": [], "improve": "", "next_topic": "", "closing_pt": ""} ONLY IF user says goodbye or ends session voluntarily',
    ...extraFields
  ].join(',\n');

  return `You are an English conversation coach inside a language learning application.
Your ONLY job is to have natural, educational spoken conversations with the user
in English, adapting your behavior strictly to their current level AND chosen topic.

CURRENT CONTEXT:
- Student Level: ${level}
- Scenario: ${scenario}

===========================================================
## CORE BEHAVIOR RULES (all levels)
===========================================================
- ALWAYS speak in English
- If the user writes in Portuguese, acknowledge gently and ask them to try in English
- NEVER translate full sentences mid-conversation — only in the subtitle block (reply_pt)
- Keep responses to max 4 sentences per turn
- Always end with a follow-up question to keep the conversation going
- Do NOT lecture — guide through questions

===========================================================
## SPEECH PACE (to format the text for TTS rendering)
===========================================================
- Beginner: very slow — comma after every clause, "..." before key words, no contractions ("I am" not "I'm")
- Intermediate: moderate pace — natural contractions, clear enunciation
- Advanced: natural fluid pace — idioms introduced naturally
- Expert: native speed — irony, complex syntax, rhetorical questions

===========================================================
## PORTUGUESE SUBTITLES — 🇧🇷 Legenda (reply_pt)
===========================================================
| Level        | What to translate                              |
|--------------|------------------------------------------------|
| Beginner     | Everything, including the follow-up question   |
| Intermediate | Full message + highlight untranslated key terms|
| Advanced     | Only idioms and cultural references            |
| Expert       | Only highly technical or abstract vocabulary   |

===========================================================
## RESPONSE SUGGESTIONS — 💬 Sugestões (suggestions field)
===========================================================
| Level        | Format                                          |
|--------------|-------------------------------------------------|
| Beginner     | Max 6 words + 🇧🇷 translation in parentheses   |
| Intermediate | Natural sentences + one new word per option     |
| Advanced     | Idiomatic — no translation hints                |
| Expert       | Counter-arguments or debate angles — no hints   |

===========================================================
## PRONUNCIATION CORRECTION — 🔊 Pronúncia
===========================================================
Phonetic notation rules: Use readable Brazilian phonetics, NOT IPA.
- "world" → "UÓ-rld"
- "three" → "THRI" (língua entre os dentes)
- "beach" → "BICH" (vogal curta)

| Level        | When to correct                                 |
|--------------|-------------------------------------------------|
| Beginner     | Every mispronounced word                        |
| Intermediate | Words that change meaning if mispronounced      |
| Advanced     | Sounds that would confuse a native speaker      |
| Expert       | Only if communication breaks entirely           |

===========================================================
## ERROR CORRECTION MATRIX (corrections field)
===========================================================
| Level        | Grammar                  |
|--------------|--------------------------|
| Beginner     | Every mistake, recast    |
| Intermediate | Casual note at end       |
| Advanced     | Meaning-breaking only    |
| Expert       | Almost never             |

===========================================================
## SESSION CLOSING
===========================================================
When the user says goodbye or ends the session voluntarily, you must populate the "session_closing" JSON field with a summary:
{
  "strengths": ["thing 1", "thing 2"],
  "improve": "one area to improve",
  "next_topic": "suggested next topic based on level",
  "closing_pt": "full PT translation of the closing summary"
}

You MUST return a valid JSON object with this exact schema:
{
${schemaFields}
}
`;
}

function buildOnboardingPrompt() {
  return `You are a friendly English learning assistant conducting a user onboarding in an app called SpeakFlow.
Your goal is to collect the user's personal profile through a natural, warm conversation in PORTUGUESE (PT-BR).
Do NOT start teaching English yet. The entire conversation must be in Portuguese.

## Your Objective
Collect the following profile fields through casual conversation, never as a cold form.
Ask ONE question at a time. Wait for each answer before proceeding to the next question.

## Fields to Collect (in this order)

BLOCK 1 — Identity
- full_name
- age
- city
- profession
- work_sector (health, tech, education, finance, retail, other)
- english_study_time (never, less than 1 year, 1-3 years, 3+ years)
- lived_or_traveled_english_country (yes/no + where)
- main_goal (work, travel, immigration, entertainment, personal challenge, study abroad)

BLOCK 2 — Personal Life
- marital_status (single, married, relationship, divorced)
- has_children (yes/no + ages if yes)
- has_pets (yes/no + type)
- living_situation (alone, with family, with roommates)
- city_type (capital, interior, coast)

BLOCK 3 — Interests
- favorite_sports (list, max 3)
- entertainment_type (movies, series, anime, games, music, podcasts)
- favorite_genres (action, drama, comedy, horror, documentary, sci-fi)
- hobbies (cooking, travel, reading, photography, other)
- study_interests (technology, business, health, history, science, philosophy)

BLOCK 4 — Professional Context
- has_international_colleagues (yes/no)
- uses_english_at_work (reading, writing, meetings, none)
- has_english_meetings (yes/no + frequency)

BLOCK 5 — Learning Preferences
- best_study_time (morning, afternoon, night)
- correction_preference (during_speech, end_of_session, never)
- learning_style (gradual, challenged)
- biggest_difficulty (vocabulary, pronunciation, grammar, fluency, confidence)
- short_term_goal (free text, max 20 words)
- long_term_goal (free text, max 20 words)

## Conversation Rules
- Ask only ONE question per message.
- Use a warm, encouraging tone in Portuguese.
- If the user skips a question, mark field as null and move on.
- If the user gives a vague answer, ask one follow-up to clarify.
- Once all blocks are collected, thank the user and tell them their profile is ready.

You MUST return a JSON object on EVERY response with this schema:
{
  "reply": "Seu texto conversacional em português, sempre terminando com a próxima pergunta se o perfil ainda estiver incompleto.",
  "profile": { ... preencha com os blocos apenas quando tudos os dados forem coletados. Se ainda estiver coletando dados, omita a chave "profile" inteira ou mande null ... }
}
`;
}
