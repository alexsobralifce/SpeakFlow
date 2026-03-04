# 🤖 AI Behavior in SpeakFlow English Conversations

> **Audience:** Developers, educators and product managers working on SpeakFlow.  
> **Last updated:** 2026-03-04  
> **Source of truth:** `apps/web/server.js` — functions `buildPrompt()` and `buildOnboardingPrompt()`

---

## Overview

SpeakFlow's AI acts as an **experienced English conversation coach**, powered by **OpenAI GPT-4o / GPT-4o-mini** via the chat completions API. Every session is either an **Onboarding** (profile setup) or a **Practice Session** (topic-based spoken conversation). The AI does not teach grammar in isolation — it guides learners through natural, structured dialogue.

---

## Session Modes

### 1. Onboarding Mode (`mode: 'onboarding'`)

The AI greets the student with a fixed warm message in **Brazilian Portuguese (PT-BR)** and collects a learner profile over exactly **5 questions**, one per conversational turn.

| Q# | What is asked | Data collected |
|----|--------------|----------------|
| 1 | Name + main goal in English | `full_name`, `main_goal` |
| 2 | Prior study + biggest challenge | `english_study_time`, `biggest_difficulty` |
| 3 | Professional / academic context | `profession`, `work_sector`, `uses_english_at_work`, `has_international_colleagues` |
| 4 | Personal interests (for future topic personalization) | `interests[]` |
| 5 | Learning style + dream English goal | `learning_style`, `dream_goal` |

**Rules during Onboarding:**
- AI responds **entirely in Portuguese (PT-BR)** — no English.
- Asks **exactly one question per turn**; waits for the student's answer.
- Is warm, human and encouraging — never robotic.
- If an answer is vague, asks **one brief follow-up**, then moves on.
- Uses the student's **first name** naturally from Q2 onwards.
- After Q5 is answered, the AI emits a **`profile` JSON object** in the response payload and the onboarding is complete.

**JSON schema returned during Onboarding:**
```json
{
  "reply": "Warm Portuguese text + next question",
  "profile": null  // null until all 5 answers are collected
}
```
After Q5:
```json
{
  "reply": "Closing warm message in Portuguese.",
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
    "learning_style": "gradual | challenged",
    "dream_goal": ""
  }
}
```

---

### 2. Practice Session Mode (`mode: 'practice'`)

The AI acts as a conversation coach. It receives the student's **level** and **chosen topic (scenario)** and generates a rich opening powered by **GPT-4o** that:

1. Welcomes the student and names the topic.
2. Lists **3–4 sub-topics or vocabulary areas** to be explored in the session.
3. Immediately asks the **first open-ended question** appropriate to the student level.

Subsequent turns use **GPT-4o-mini** for fast, cost-effective responses.

---

## Core Conversational Behavior (Practice Mode)

### 🎯 Topic Adherence
- The session topic is **fixed** from the start — the AI never asks what the student wants to talk about.
- If the student drifts off-topic, the AI acknowledges it briefly and **guides them back**: *"That's interesting! Let's explore that with our topic — [connect back to topic]."*
- Every question and follow-up is grounded in the chosen scenario.

### 🔄 Turn Discipline
- The AI asks **exactly ONE question per response** — never more.
- It **waits for the student's answer** before introducing new questions or topics.
- If an answer is unclear, too short or off-topic, the AI asks the student to elaborate before moving on.
- If the student ignores the question and changes subject, the AI acknowledges it and guides them back.

### 📏 Response Length
- Maximum **4 sentences per turn**.
- Always ends with **exactly one follow-up question** to keep the conversation going.

### 🌍 Language Rules
- The AI **always speaks in English** during practice sessions.
- If the student writes in Portuguese, the AI gently acknowledges it and asks them to try in English.
- Full sentence translations only appear in the optional `reply_pt` (subtitle) field — never mid-conversation.

---

## Adaptive Behavior by Student Level

### 🗣️ Speech Pace (TTS formatting)

| Level | Style |
|-------|-------|
| **Beginner** | Very slow: comma after every clause, `...` before key words, no contractions (`"I am"`, not `"I'm"`) |
| **Intermediate** | Moderate: natural contractions, clear enunciation |
| **Advanced** | Natural, fluid: idioms introduced naturally |
| **Expert** | Native speed: irony, complex syntax, rhetorical questions |

### ✏️ Grammar Correction

| Level | Approach |
|-------|----------|
| **Beginner** | Corrects every mistake with a recast |
| **Intermediate** | Casual note at the end of the turn |
| **Advanced** | Only meaning-breaking errors |
| **Expert** | Almost never corrects |

### 🔊 Pronunciation Correction (`pronunciation_tips` field)

Phonetic notation uses **readable Brazilian phonetics**, not IPA.  
Examples: `"world" → "UÓ-rld"` · `"three" → "THRI"` · `"beach" → "BICH"`

| Level | When to correct |
|-------|----------------|
| **Beginner** | Every mispronounced word |
| **Intermediate** | Words that change meaning if mispronounced |
| **Advanced** | Sounds that would confuse a native speaker |
| **Expert** | Only if communication breaks entirely |

### 🇧🇷 Portuguese Subtitles (`reply_pt` field — optional feature)

| Level | What is translated |
|-------|--------------------|
| **Beginner** | Everything, including the follow-up question |
| **Intermediate** | Full message + untranslated key terms highlighted |
| **Advanced** | Only idioms and cultural references |
| **Expert** | Only highly technical or abstract vocabulary |

---

## Response Suggestions (`suggestions` field)

The AI **always** generates exactly **3 response options** the student can use to reply. They vary deliberately in complexity:

| Option | Style |
|--------|-------|
| **1 – Simple** | Short, direct, safe |
| **2 – Intermediate** | Natural sentence + one new word |
| **3 – Advanced** | Idiomatic or challenging expression |

**Format by level:**

| Level | Format |
|-------|--------|
| **Beginner** | Max 6 words + 🇧🇷 translation in parentheses |
| **Intermediate** | Natural sentences + one new word per option |
| **Advanced** | Idiomatic — no translation hints |
| **Expert** | Counter-arguments or debate angles — no hints |

---

## Session Lifecycle

```
User connects via Socket.IO
      │
      ▼
[start_session event]
      │
      ├── mode: 'onboarding' → Fixed PT-BR greeting → AI collects 5-question profile
      │
      └── mode: 'practice'  → GPT-4o generates rich topic intro + first question
                                       │
                                       ▼
                              [AI speaks via TTS]
                              waitingForUser = true
                                       │
                                       ▼
                     ┌────────── User sends audio or text ──────────┐
                     │                                              │
                     ▼                                              ▼
              Google STT (streaming)                   OpenAI Whisper (fallback)
                     │                                              │
                     └──────────────────┬───────────────────────────┘
                                        ▼
                               processTurn(userText)
                                        │
                                        ▼
                              GPT-4o-mini generates JSON
                              {reply, corrections, suggestions,
                               pronunciation_tips, reply_pt,
                               session_closing, profile}
                                        │
                                        ▼
                              AI speaks reply via TTS
                              waitingForUser = true
                                        │
                                        │ (if user silent > 1 min)
                                        ▼
                              [nudge_requested event]
                              AI sends a gentle nudge message
```

### Nudge System
If the user is **inactive for over 1 minute** while the AI is waiting, the frontend emits a `nudge_requested` event. The AI replies with one of three pre-defined friendly nudge messages (randomly selected) via TTS:

- *"Hey, still there? 😊 Take your time — no pressure!"*
- *"No worries! Whenever you're ready, I'm here to practice with you."*
- *"It's okay to think before you speak — that's actually great practice!"*

### Session Timeout
Each session has a **10-minute maximum duration**. After that, the server emits a `session_timeout` event and closes the recognition stream.

### Session Closing
When the student says **goodbye or voluntarily ends the session**, the AI populates the `session_closing` field with a performance summary:

```json
{
  "session_closing": {
    "strengths": ["thing 1", "thing 2"],
    "improve": "one area to improve",
    "next_topic": "suggested next topic based on level",
    "closing_pt": "full PT-BR translation of the closing summary"
  }
}
```

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| AI Conversation Brain | OpenAI GPT-4o (session openers) + GPT-4o-mini (each turn) |
| Speech-to-Text (primary) | Google Cloud Speech-to-Text (streaming, WEBM/OPUS) |
| Speech-to-Text (fallback) | OpenAI Whisper (`whisper-1`) |
| Text-to-Speech (primary) | Google Cloud TTS — voice `en-US-Journey-F` |
| Text-to-Speech (fallback) | OpenAI TTS — voice `alloy` (model `tts-1`) |
| Real-time transport | Socket.IO |

---

## AI Response JSON Schema (Practice Mode)

```json
{
  "reply": "The natural English text the AI speaks back to the student",
  "corrections": [
    {
      "original": "student's original text",
      "corrected": "corrected version",
      "rule": "PT-BR explanation, max 2 lines"
    }
  ],
  "session_closing": null,
  "reply_pt": "PT-BR subtitle (only if subtitlesPt setting is enabled)",
  "suggestions": [
    { "text": "Simple short sentence" },
    { "text": "Intermediate sentence with a new word" },
    { "text": "Advanced/idiomatic expression" }
  ],
  "pronunciation_tips": [
    {
      "word": "word",
      "phonetic": "UÓ-rld",
      "tip": "PT-BR pronunciation tip"
    }
  ]
}
```

---

*Document generated from source analysis of `apps/web/server.js`.*
