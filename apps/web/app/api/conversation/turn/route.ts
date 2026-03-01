import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { audioBase64, sessionId, history, scenario, level } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ error: 'Audio data is required' }, { status: 400 });
    }

    // 1. Convert base64 to File for Whisper
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const audioFile = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    // 2. Transcribe User Audio via Whisper STT
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Forcing English as expected language
    });
    const userText = transcription.text;

    // 3. Build System Prompt & History
    const sysPrompt = buildPedagogicalSystemPrompt(level, scenario);
    const messages = [
      { role: 'system', content: sysPrompt },
      ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userText }
    ] as any[];

    // 4. Get completion from GPT-4o (structured JSON)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const aiResponseContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(aiResponseContent || '{}');

    // 5. Generate TTS Audio for Assistant Reply
    const ttsResponse = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: parsedResponse.reply,
    });
    const ttsBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    const replyAudioBase64 = ttsBuffer.toString('base64');

    // 6. Return standard structured response
    return NextResponse.json({
      userTranscription: userText,
      replyText: parsedResponse.reply,
      replyAudio: replyAudioBase64,
      corrections: parsedResponse.corrections || [],
      newWords: parsedResponse.new_words || [],
      score: parsedResponse.score || { fluency: 0, grammar: 0, vocabulary: 0 },
      nextQuestion: parsedResponse.next_question || ""
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to process turn' }, { status: 500 });
  }
}

function buildPedagogicalSystemPrompt(level: string, scenario: string) {
  return `
You are an expert native English tutor specifically adapted to teaching Brazilian students.
Your persona is incredibly supportive, conversational, and natural. Do not act like a robotic teacher, but like a friendly native speaker engaged in a roleplay.

CURRENT CONTEXT:
- Student Level: ${level} (Adjust your vocabulary and grammar complexity to match this, but always stay natural).
- Scenario: ${scenario}. We are currently inside this scenario. Act your part.

CONVERSATION RULES:
1. ALWAYS reply in natural English. Keep your responses concise (1 to 3 sentences maximum), simulating a real conversation turn.
2. Ask a question at the end to keep the conversation flowing.
3. NEVER be condescending. Be encouraging.

JSON OUTPUT REQUIREMENT:
You MUST return your response as a valid JSON object with the following schema exactly:

{
  "reply": "The natural English text you are speaking back to the user",
  "corrections": [
    {
      "original": "the exact phrase the user said wrong",
      "corrected": "how a native would say it naturally",
      "rule": "Explanation of the rule in PT-BR (maximum 2 lines)"
    }
  ],
  "new_words": [
    {
      "word": "a new valuable vocabulary word you used in your reply",
      "phonetic": "IPA pronunciation",
      "example": "usage example sentence"
    }
  ],
  "score": {
    "fluency": <number 0-100>,
    "grammar": <number 0-100>,
    "vocabulary": <number 0-100>
  },
  "next_question": "the question you asked at the end of your reply"
}

PEDAGOGICAL RULES:
- Corrections: Identify at most 2 major errors from the user's last turn. Prioritize errors that impact understanding. If the input is perfect, return an empty array for corrections. Provide the explanation ("rule") in Portuguese (PT-BR).
- New Words: Automatically extract 1 or 2 useful advanced words that you purposefully included in your 'reply', to enrich the user's vocabulary.
- Score Assessment: Score the *user's last input*. Fluency based on flow, Grammar based on structure, Vocabulary based on word choice. 100 is flawless native level.
`;
}
