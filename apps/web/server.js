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

// Avoid instantiating during build if running in CI without keys
let speechClient;
let ttsClient;
try {
  speechClient = new speech.SpeechClient();
  ttsClient = new textToSpeech.TextToSpeechClient();
} catch (e) {
  console.log('Skipping Google Cloud client init (no credentials)');
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

    // Timer handles
    let sessionTimeout = null;
    const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 minutes

    socket.on('start_session', async (config) => {
      sessionLevel = config.level || sessionLevel;
      sessionScenario = config.scenario || sessionScenario;
      sessionHistory = [];

      console.log(`[Session] Started. Level: ${sessionLevel}. Scenario: ${sessionScenario}`);

      // Set 10m auto-kill timer
      sessionTimeout = setTimeout(() => {
        console.log(`[Session] 10m limit reached for ${socket.id}`);
        socket.emit('session_timeout', { message: 'Time is up! Great job today.' });
        if (recognizeStream) {
          recognizeStream.end();
        }
      }, SESSION_DURATION_MS);

      // Send initial AI greeting
      const greeting = `Hello! We have 10 minutes to practice. What topic would you like to study today?`;

      try {
        if (ttsClient) {
          const [resp] = await ttsClient.synthesizeSpeech({
            input: { text: greeting },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          socket.emit('ai_reply_audio', { audioBase64: resp.audioContent.toString('base64'), text: greeting });
        } else {
          // Fallback to OpenAI TTS if Google not configured properly
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: greeting,
          });
          const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          socket.emit('ai_reply_audio', { audioBase64: ttsBuffer.toString('base64'), text: greeting });
        }
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('start_recognition_stream', () => {
      if (!speechClient) return;

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

    socket.on('disconnect', () => {
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (recognizeStream) recognizeStream.end();
      console.log('[Socket] Client disconnected');
    });

    async function processTurn(userText) {
      try {
        // Let client know AI is thinking
        socket.emit('ai_thinking', true);

        const sysPrompt = buildPrompt(sessionLevel, sessionScenario);
        const messages = [
          { role: 'system', content: sysPrompt },
          ...sessionHistory,
          { role: 'user', content: userText }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages,
          response_format: { type: 'json_object' },
        });

        const parsedResponse = JSON.parse(completion.choices[0].message.content || '{}');
        const aiReplyText = parsedResponse.reply || "I didn't quite catch that.";

        // Save to history
        sessionHistory.push({ role: 'user', content: userText });
        sessionHistory.push({ role: 'assistant', content: aiReplyText });

        // Send feedback metadata back immediately
        socket.emit('ai_reply_text', {
          text: aiReplyText,
          corrections: parsedResponse.corrections || [],
          newWords: parsedResponse.new_words || []
        });

        // TTS stream
        if (ttsClient) {
          const [resp] = await ttsClient.synthesizeSpeech({
            input: { text: aiReplyText },
            voice: { languageCode: 'en-US', name: 'en-US-Journey-F' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          socket.emit('ai_reply_audio', { audioBase64: resp.audioContent.toString('base64'), text: aiReplyText });
        } else {
          const ttsResponse = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: aiReplyText,
          });
          const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
          socket.emit('ai_reply_audio', { audioBase64: ttsBuffer.toString('base64'), text: aiReplyText });
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
});

function buildPrompt(level, scenario) {
  return `
You are an expert native English tutor specifically adapted to teaching Brazilian students.
CURRENT CONTEXT:
- Student Level: ${level}
- Scenario: ${scenario}

You MUST return your response as a valid JSON object with the following schema exactly:
{
  "reply": "The natural English text you are speaking back to the user",
  "corrections": [{"original": "", "corrected": "", "rule": "PT-BR explanation (max 2 lines)"}],
  "new_words": [{"word": "", "phonetic": "", "example": ""}]
}
Keep the reply to 1-2 sentences maximum, keeping a fast, engaging continuous dialogue. Ask a follow-up question.
`;
}
