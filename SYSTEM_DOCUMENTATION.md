# SpeakFlow — System Documentation

> **Versão:** 0.1.0 (Development)  
> **Data:** Março 2026  
> **Arquitetura:** Monorepo (Turborepo)  

---

## 1. Visão Geral

O **SpeakFlow** é uma plataforma de aprendizado de conversação em inglês com IA. O sistema permite que o usuário pratique inglês falado com um tutor virtual que:

- Inicia uma sessão de 10 minutos
- Ouve o usuário em tempo real via microfone
- Transcenda o áudio com Google Speech-to-Text
- Gera respostas contextuais com GPT-4o (OpenAI)
- Fala de volta via Google Text-to-Speech ou OpenAI TTS
- Exibe correções gramaticais em tempo real na UI

---

## 2. Estrutura do Monorepo

```
SpeakFlow/
├── apps/
│   ├── web/         → Aplicação Next.js 14 (App Router)
│   └── mobile/      → Aplicação Expo (React Native)
├── packages/
│   ├── ui/          → Componentes UI compartilhados
│   ├── config/      → Config Tailwind CSS compartilhada
│   └── db/          → Schema Prisma + cliente de banco de dados
├── turbo.json       → Orquestração de tarefas (Turborepo)
└── package.json     → Workspace root
```

---

## 3. Aplicação Web (`apps/web`)

### 3.1 Stack Tecnológico

| Tecnologia | Função |
|---|---|
| **Next.js 14** (App Router) | Framework React com SSR/RSC |
| **Node.js custom server** (`server.js`) | Servidor HTTP com Socket.IO |
| **Socket.IO** | Comunicação bidirecional em tempo real |
| **Google Cloud Speech-to-Text** | Transcrição de áudio em streaming |
| **Google Cloud Text-to-Speech** | Síntese de voz (fallback: OpenAI TTS) |
| **OpenAI GPT-4o** | Geração de respostas do tutor IA |
| **Tailwind CSS** | Estilização baseada em design tokens |
| **Vitest + Testing Library** | Testes unitários de componentes React |
| **Playwright** | Testes End-to-End do browser |

### 3.2 Estrutura de Pastas

```
apps/web/
├── app/                         → Rotas Next.js (App Router)
│   ├── (dashboard)/
│   │   └── conversation/[id]/
│   │       └── page.tsx         → Rota da sessão de conversa
│   ├── api/                     → API Routes
│   ├── globals.css              → Variáveis CSS de design tokens
│   ├── layout.tsx               → Layout raiz + carregamento de fontes
│   └── page.tsx                 → Landing page
├── src/                         → Código de negócios (feature-sliced)
│   ├── features/
│   │   └── conversation/
│   │       ├── components/
│   │       │   ├── ConversationScreen.tsx   → Componente de UI (dumb)
│   │       │   └── __tests__/
│   │       │       └── ConversationScreen.test.tsx
│   │       ├── hooks/
│   │       │   └── useConversation.ts       → Hook de estado e lógica
│   │       ├── services/
│   │       ├── types/
│   │       └── utils/
│   ├── components/              → Componentes globais compartilhados
│   ├── hooks/                   → Hooks globais
│   ├── lib/                     → Utilitários de biblioteca (ex: clsx)
│   ├── services/                → Clientes HTTP/API
│   ├── types/                   → Tipos TypeScript globais
│   └── utils/                   → Funções puras
├── e2e/
│   └── speakflow.spec.ts        → Testes E2E Playwright
├── server.js                    → Servidor Node.js customizado com Socket.IO
├── playwright.config.ts         → Config Playwright (aponta para /e2e)
├── vitest.config.ts             → Config Vitest (aponta para /src)
└── tsconfig.json
```

### 3.3 Fluxo de Arquitetura — Sessão de Conversa

```
Usuário pressiona o microfone
        │
        ▼
[Browser — MediaRecorder API]
Captura áudio em chunks (WEBM/OPUS, 250ms)
        │
        ▼ socket.emit('audio_data', chunk)
[server.js — Socket.IO]
Recebe o chunk e repassa ao stream
        │
        ▼
[Google Cloud Speech-to-Text]
streamingRecognize() processa o áudio
        │ transcription_update (interimResults=true)
        ▼
[Browser — useConversation.ts hook]
Exibe transcrição parcial em overlay (liveTranscript)
        │
        │ (quando isFinal=true)
        ▼
[server.js — processTurn()]
Chama GPT-4o com histórico da sessão
        │
        │ Recebe JSON estruturado:
        │   { reply, corrections, new_words }
        ▼
[Google Cloud TTS / OpenAI TTS]
Converte reply texto → áudio MP3 (base64)
        │
        ▼ socket.emit('ai_reply_audio', { audioBase64, text })
[Browser — useConversation.ts hook]
Reproduz áudio via Web Audio API
Exibe mensagem na timeline de chat
        │
        ▼ socket.emit('ai_reply_text', { corrections })
[ConversationScreen.tsx]
Exibe correções no painel "Real-time Insights"
```

### 3.4 `server.js` — Servidor Principal

O arquivo `apps/web/server.js` é o coração do sistema de tempo real:

- **Servidor HTTP**: cria um servidor Node.js que delega todas as requisições ao handler do Next.js
- **Socket.IO**: inicializa um servidor WebSocket no mesmo processo
- **Eventos Socket**:
  | Evento | Direção | Descrição |
  |---|---|---|
  | `start_session` | Client → Server | Inicia uma sessão, dispara saudação da IA |
  | `start_recognition_stream` | Client → Server | Abre o stream de reconhecimento de fala |
  | `audio_data` | Client → Server | Chunk de áudio para ser processado |
  | `stop_recognition_stream` | Client → Server | Encerra o stream de reconhecimento |
  | `transcription_update` | Server → Client | Transcrição parcial ou final |
  | `ai_thinking` | Server → Client | Indicador de "IA processando" |
  | `ai_reply_text` | Server → Client | Texto + correções da resposta da IA |
  | `ai_reply_audio` | Server → Client | Áudio MP3 em base64 da resposta da IA |
  | `session_timeout` | Server → Client | Aviso de fim de sessão (10 minutos) |

- **Timer de sessão**: ao iniciar, um `setTimeout` de 10 minutos é criado. Ao expirar, o servidor emite `session_timeout` e encerra o stream.

### 3.5 `useConversation.ts` — Hook Customizado

O hook centraliza **toda a lógica de estado e efeitos colaterais** da tela de conversa, desacoplando-a do componente visual.

**Estado gerenciado:**
- `messages: TMessage[]` — histórico de mensagens da sessão
- `isRecording: boolean` — se o microfone está ativo
- `isLoading: boolean` — se a IA está processando resposta
- `showSubtitles: boolean` — visibilidade das legendas (closed captions)
- `sessionActive: boolean` — se a sessão de 10 minutos está rodando
- `timeRemaining: number` — segundos restantes (600 → 0)
- `liveTranscript: string` — transcrição parcial em andamento

**Ações expostas:**
- `startSessionFlow()` — conecta ao servidor, inicia a sessão com nível e cenário
- `endSessionFlow()` — para gravação, desconecta socket, reseta estado
- `startRecording()` — solicita permissão de microfone, inicia MediaRecorder
- `stopRecording()` — para MediaRecorder, encerra microfone e stream
- `toggleSubtitles()` — alterna a exibição de legendas

### 3.6 `ConversationScreen.tsx` — Componente de UI

Componente **presentational (dumb)** que apenas recebe dados do hook e renderiza a interface. Estrutura visual:

- **Coluna esquerda (2/3):** área de chat com mensagens animadas, transcrição ao vivo, e botão de microfone push-to-talk
- **Coluna direita (1/3, apenas desktop):** painel de "Real-time Insights" com correções gramaticais exibidas por turno
- **Header:** Avatar da IA, contador de tempo, botão Start/End Session, toggle de legendas

---

## 4. Design System

### 4.1 Tokens (Tailwind + CSS Variables)

Definidos em `packages/config/tailwind.config.ts` e mapeados para CSS variables em `apps/web/app/globals.css`:

| Token | Modo Claro | Modo Escuro |
|---|---|---|
| `--color-bg-primary` | `#FFFFFF` | `#0F172A` |
| `--color-bg-secondary` | `#F8FAFC` | `#1E293B` |
| `--color-text-primary` | `#0F172A` | `#F8FAFC` |
| `--color-text-secondary` | `#475569` | `#CBD5E1` |
| `--color-brand` | `#2563EB` | `#3B82F6` |
| `--color-success` | `#16A34A` | `#22C55E` |
| `--color-danger` | `#DC2626` | `#EF4444` |

### 4.2 Tipografia

| Família | Uso | Variável CSS |
|---|---|---|
| **Inter** | Corpo, display | `--font-inter` |
| **JetBrains Mono** | Código, timer | `--font-mono` |

Carregadas via `next/font/google` no `RootLayout`.

### 4.3 Componentes da UI Compartilhada (`packages/ui`)

Todos os componentes utilizam `clsx` + `tailwind-merge` para composição de classes:

| Componente | Variantes |
|---|---|
| `Button` | `primary`, `secondary`, `ghost`, `icon-only`, `isLoading` |
| `Avatar` | Usuário e IA, com estado de `isSpeaking` animado |
| `MessageBubble` | `user`, `assistant`, `isLoading` (skeleton), `isError` |
| `AudioWaveformVisualizer` | Animação de onda sonora durante gravação |
| `FeedbackChip` | Correções, erros e dicas com semântica de cores |
| `FluencyProgressBar` | Barra animada de pontuação de fluência |
| `BottomTabNavigation` | Navegação mobile (React Native) |
| `TopNavigationBar` | Barra de cabeçalho (Web + Mobile) |

---

## 5. Banco de Dados (`packages/db`)

### 5.1 Configuração

- **ORM:** Prisma
- **Banco:** PostgreSQL
- **Conexão:** variável de ambiente `DATABASE_URL`

### 5.2 Schema

```
User
├── id, email, name, image
├── level (beginner/intermediate/advanced)
├── nativeLanguage (padrão: "pt-BR")
├── sessions → Session[]
├── vocabulary → VocabWord[]
└── progress → Progress[]

Session
├── id, userId, scenario
├── startedAt, endedAt
├── messages → Message[]
└── scores (JSON: { fluency, grammar, vocabulary })

Message
├── id, sessionId, role
├── content (texto da mensagem)
├── audioUrl (opcional)
├── corrections (JSON: array de correções)
└── newWords (JSON: vocabulário novo identificado)

VocabWord
└── word, phonetic, example (palavras salvas pelo usuário)

Progress
└── date, streak, xp, level (histórico de progresso diário)
```

---

## 6. Aplicação Mobile (`apps/mobile`)

> Status: estrutura inicial criada; desenvolvimento completo planejado para fase seguinte.

### 6.1 Stack

- **Expo** com **Expo Router** (file-based navigation)
- **NativeWind** (Tailwind para React Native)
- **react-native-reanimated** para animações fluidas

### 6.2 Hook `useVoiceConversation`

Localizado em `apps/mobile/hooks/useVoiceConversation.ts`, orquestra:

1. Solicita permissão de microfone via `expo-av`
2. Grava o áudio e converte para base64 via `expo-file-system`
3. Envia para a API REST do Next.js (`/api/conversation/turn`)
4. Recebe o áudio de resposta da IA e reproduz automaticamente

---

## 7. Testes

### 7.1 Testes Unitários — Vitest

Configuração: `apps/web/vitest.config.ts` com ambiente `jsdom`.

**Arquivo principal:** `src/features/conversation/components/__tests__/ConversationScreen.test.tsx`

| Teste | Descrição |
|---|---|
| `renders initial state correctly` | Verifica timer 10:00, botão Start Session e hint de microfone |
| `displays end session when active` | Verifica exibição do botão End Session quando sessão está ativa |
| `triggers start session on click` | Garante que `startSessionFlow` é chamado ao clicar em Start |

**Como executar:**
```bash
cd apps/web
npx vitest run
```

### 7.2 Testes E2E — Playwright

Configuração: `apps/web/playwright.config.ts` apontando para `./e2e`.

**Arquivo:** `e2e/speakflow.spec.ts`

Cobre o fluxo completo: Onboarding → Dashboard → Sessão de Conversa → Feedback.

**Como executar:**
```bash
cd apps/web
npx playwright test
```

> **Nota:** O servidor de desenvolvimento é iniciado automaticamente pelo Playwright via `webServer` config.

---

## 8. Variáveis de Ambiente

Crie o arquivo `apps/web/.env.local` com as seguintes chaves:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Google Cloud (opcional — cai para OpenAI se ausente)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Database
DATABASE_URL=postgresql://user:password@host:5432/speakflow

# Next.js
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## 9. Como Executar Localmente

### Pré-requisitos

- Node.js 18+
- npm 9+

### Instalação

```bash
# Na raiz do monorepo
npm install
```

### Desenvolvimento Web

```bash
cd apps/web
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

A rota de conversa está disponível em: `/conversation/[qualquer-id]`

### Turborepo (todos os apps)

```bash
# Na raiz
npm run dev
```

---

## 10. Fluxo de Dados — Diagrama Simplificado

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js)                    │
│                                                             │
│  ConversationScreen.tsx  ◄──── useConversation.ts (hook)   │
│         │ render                      │ state + effects     │
│         │                            │                      │
│         │                   socket.io-client                │
└─────────┼────────────────────────────┼────────────────────-─┘
          │ User presses mic           │ WebSocket events
          ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    server.js (Node.js)                      │
│                                                             │
│  Socket.IO Server                                           │
│       │                                                     │
│       ├── Google Cloud STT (streaming)                      │
│       ├── OpenAI GPT-4o (chat completions)                  │
│       └── Google Cloud TTS / OpenAI TTS                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Decisões de Arquitetura

| Decisão | Justificativa |
|---|---|
| **Custom server.js** ao invés de API Routes | Next.js serverless não suporta WebSocket persistente. O `server.js` mantém o socket em memória por toda a sessão. |
| **Feature-sliced design** (`src/features/`) | Escalabilidade: cada feature (conversation, feedback, onboarding) tem seus próprios components, hooks, services e types. |
| **Hook separado do componente** | `ConversationScreen` é um componente dumb — testável isoladamente fazendo mock do hook. |
| **CSS Variables + Tailwind** | Permite troca de tema (dark/light) com uma única classe no `<html>`, sem duplicar classes Tailwind. |
| **Turborepo** | Gerencia builds e tarefas em paralelo no monorepo, com cache inteligente. |
| **Prisma + PostgreSQL** | ORM type-safe com migrations automáticas e suporte a queries relacionais complexas. |
