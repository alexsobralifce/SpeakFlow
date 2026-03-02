import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation, TMessage, TSessionSettings } from '../hooks/useConversation';

export const TOPICS = {
  beginner: [
    { id: 'b1', label: '👋 Greetings and introductions' },
    { id: 'b2', label: '👨👩👧 Family and relationships' },
    { id: 'b3', label: '🍕 Food, drinks and restaurants' },
    { id: 'b4', label: '🕐 Daily routine and time' },
    { id: 'b5', label: '🌤️ Weather and seasons' },
  ],
  intermediate: [
    { id: 'i1', label: '💼 Your job or studies' },
    { id: 'i2', label: '✈️ Travel and vacation experiences' },
    { id: 'i3', label: '🎬 Movies, music and books' },
    { id: 'i4', label: '📱 Technology and social media' },
    { id: 'i5', label: '🏙️ Describing your city' },
  ],
  advanced: [
    { id: 'a1', label: '🏢 Career goals and professional challenges' },
    { id: 'a2', label: '🏠 Remote work: pros and cons' },
    { id: 'a3', label: '🌎 Cultural differences between countries' },
    { id: 'a4', label: '🧠 Mental health and well-being' },
    { id: 'a5', label: '📰 Current events: environment and economy' },
  ],
  expert: [
    { id: 'e1', label: '🤖 AI ethics and the future of work' },
    { id: 'e2', label: '🧬 Philosophy of language and thought' },
    { id: 'e3', label: '🏛️ Political rhetoric and persuasion' },
    { id: 'e4', label: '⚖️ Law, freedom of speech and censorship' },
    { id: 'e5', label: '📊 Economic inequality and social mobility' },
  ]
};

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

const ActiveRecordingWaveform = () => (
  <div className="flex items-center gap-1 h-12">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="w-2 bg-white rounded-full"
        animate={{ height: ['20%', '100%', '30%', '80%', '20%'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
      />
    ))}
  </div>
);

const StandbyWaveform = () => (
  <div className="flex items-center gap-1 h-12 opacity-30">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="w-2 h-2 bg-white rounded-full" />
    ))}
  </div>
);

const Avatar = ({ isSpeaking }: { isSpeaking: boolean }) => (
  <div className="relative">
    <div className={`w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl shadow-indigo-500/30 flex items-center justify-center text-white text-xl border-2 border-white/20 z-10 relative ${isSpeaking ? 'animate-pulse' : ''}`}>
      ✨
    </div>
    {isSpeaking && (
      <motion.div
        className="absolute inset-0 rounded-full bg-indigo-500/50 z-0"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )}
  </div>
);

// ── Settings Panel ──────────────────────────────────────────────
interface SettingsOption {
  key: keyof TSessionSettings;
  label: string;
  description: string;
  icon: string;
}

const OPTIONS: SettingsOption[] = [
  {
    key: 'subtitlesPt',
    label: 'Legenda em Português',
    description: 'Exibe uma tradução do que a IA falou em PT-BR logo abaixo do texto em inglês.',
    icon: '🇧🇷',
  },
  {
    key: 'suggestionsEnabled',
    label: 'Sugestões de resposta',
    description: 'A IA sugere 2–3 respostas possíveis para te ajudar a manter o diálogo.',
    icon: '💡',
  },
  {
    key: 'pronunciationMode',
    label: 'Correção de pronúncia',
    description: 'A IA analisa o áudio e indica palavras pronunciadas de forma diferente do nativo.',
    icon: '🔊',
  },
];

const SettingsPanel = ({
  settings,
  updateSetting,
  sessionActive,
}: {
  settings: TSessionSettings;
  updateSetting: <K extends keyof TSessionSettings>(k: K, v: TSessionSettings[K]) => void;
  sessionActive: boolean;
}) => (
  <div className="absolute right-4 top-[72px] z-50 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-5">
    <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      Auxílio ao Aluno
    </h3>

    {sessionActive && (
      <div className="mb-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2">
        ⚠️ Reinicie a sessão para aplicar mudanças.
      </div>
    )}

    <div className="flex flex-col gap-3">
      {OPTIONS.map(({ key, label, description, icon }) => (
        <label
          key={key}
          className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
            ${settings[key]
              ? 'bg-indigo-500/10 border-indigo-500/30'
              : 'bg-slate-800/50 border-white/5 hover:border-white/15'
            }`}
        >
          {/* Checkbox (hidden, styled via sibling) */}
          <input
            type="checkbox"
            className="sr-only"
            checked={settings[key]}
            onChange={e => updateSetting(key, e.target.checked)}
          />

          {/* Custom toggle */}
          <div className={`relative mt-0.5 flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 ${settings[key] ? 'bg-indigo-500' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>

          <div>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <span>{icon}</span>
              {label}
            </p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
          </div>
        </label>
      ))}
    </div>
  </div>
);

// ── Message Bubble ────────────────────────────────────────────
const MessageBubble = ({ msg, showPt }: { msg: TMessage; showPt: boolean }) => (
  <div className="flex flex-col mb-6 w-full max-w-2xl px-4">
    <div className={`flex w-full ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`p-5 text-[15px] leading-relaxed shadow-sm
          ${msg.role === 'assistant'
            ? 'bg-slate-800/80 backdrop-blur-xl text-slate-100 rounded-3xl rounded-tl-sm border border-white/5'
            : 'bg-indigo-600/90 backdrop-blur-xl text-white rounded-3xl rounded-tr-sm shadow-indigo-600/20'}
        `}
      >
        {msg.content}
      </div>
    </div>

    {/* PT-BR subtitle */}
    {msg.role === 'assistant' && showPt && msg.contentPt && (
      <div className="mt-2 ml-1 text-[13px] text-slate-500 italic flex items-start gap-1">
        <span className="text-xs">🇧🇷</span>
        <span>{msg.contentPt}</span>
      </div>
    )}

    {/* Pronunciation tips */}
    {msg.pronunciationTips && msg.pronunciationTips.length > 0 && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        className="mt-3 ml-1 flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 flex items-center gap-1">
          <span>🔊</span> Pronúncia
        </p>
        {msg.pronunciationTips.map((t, i) => (
          <div key={i} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-sm">
            <span className="font-bold text-purple-300">{t.word}</span>
            <span className="text-slate-400 ml-2 text-xs font-mono">{t.phonetic}</span>
            <p className="text-slate-400 text-xs mt-1">{t.tip}</p>
          </div>
        ))}
      </motion.div>
    )}

    {/* Grammar corrections */}
    {msg.role === 'user' && msg.corrections && msg.corrections.length > 0 && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        className="mt-2 ml-auto flex flex-col gap-2 w-full max-w-[85%]">
        {msg.corrections.map((c, i) => (
          <div key={i} className="bg-rose-500/10 border border-rose-500/20 backdrop-blur-sm rounded-2xl p-4 text-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50" />
            <p className="line-through text-rose-300/60 mb-1">{c.original}</p>
            <p className="text-emerald-300 font-medium mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              {c.corrected}
            </p>
            <p className="text-slate-400 text-xs italic">{c.rule}</p>
          </div>
        ))}
      </motion.div>
    )}

    {/* Suggestion chips */}
    {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="mt-3 ml-1 flex flex-wrap gap-2">
        <p className="w-full text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1 mb-1">
          <span>💡</span> Você pode dizer:
        </p>
        {msg.suggestions.map((s, i) => (
          <div key={i} className="px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full text-sm text-amber-200 cursor-default hover:bg-amber-400/20 transition-colors">
            "{s.text}"
          </div>
        ))}
      </motion.div>
    )}

    {/* Pronunciation tips */}
    {msg.role === 'assistant' && msg.pronunciationTips && msg.pronunciationTips.length > 0 && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
        className="mt-3 ml-1 flex flex-col gap-2 w-full max-w-[85%]">
        <p className="w-full text-xs font-bold uppercase tracking-widest text-teal-400 flex items-center gap-1 mb-1">
          <span>🔊</span> Dicas de Pronúncia:
        </p>
        {msg.pronunciationTips.map((p, i) => (
          <div key={i} className="bg-teal-500/10 border border-teal-500/20 backdrop-blur-sm rounded-2xl p-4 text-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50" />
            <p className="text-white font-medium mb-1">Você disse: <span className="text-teal-300">"{p.word}"</span></p>
            <p className="text-slate-300 mb-2 font-mono">Pronúncia: <span className="text-teal-400">{p.phonetic}</span></p>
            <p className="text-slate-400 text-xs">{p.tip}</p>
          </div>
        ))}
      </motion.div>
    )}
  </div>
);

// ── Loading Bubble ────────────────────────────────────────────
const LoadingBubble = () => (
  <div className="flex w-full max-w-2xl px-4 justify-start mb-6">
    <div className="p-4 bg-slate-800/80 backdrop-blur-xl text-slate-100 rounded-3xl rounded-tl-sm border border-white/5">
      <div className="flex gap-1.5 items-center h-5 px-2">
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-indigo-300"
            animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d }} />
        ))}
      </div>
    </div>
  </div>
);

const formatTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ──────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────
export function ConversationScreen({ initialLevel = 'intermediate', initialTopic }: { initialLevel?: string, initialTopic?: string | null }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    messages,
    isRecording,
    isLoading,
    showSubtitles,
    sessionActive,
    timeRemaining,
    liveTranscript,
    settings,
    sessionClosing,
    startSessionFlow,
    endSessionFlow,
    startRecording,
    stopRecording,
    toggleSubtitles,
    updateSetting,
  } = useConversation(initialLevel, initialTopic);

  const handleStartClick = () => {
    startSessionFlow(initialTopic || 'Free talk');
  };

  const isSpeaking = isLoading || (sessionActive && !isRecording && messages[messages.length - 1]?.role === 'assistant');

  const topicsForLevel = TOPICS[initialLevel as keyof typeof TOPICS] || TOPICS.intermediate;

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans overflow-hidden text-slate-100 selection:bg-indigo-500/30">

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 bg-slate-950/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
          <Avatar isSpeaking={isSpeaking} />
          <div>
            <h2 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              AI Tutor
              {sessionActive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <span data-testid="session-timer" className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-xs text-slate-500">Intensive Practice</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CC toggle */}
          <button
            data-testid="btn-cc-toggle"
            onClick={toggleSubtitles}
            title="Legendas"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${showSubtitles ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-slate-300'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {showSubtitles ? 'Hide CC' : 'Show CC'}
          </button>

          {/* ⚙️ Gear settings button */}
          <button
            data-testid="btn-settings"
            onClick={() => setSettingsOpen(o => !o)}
            title="Opções de auxílio"
            className={`relative p-2.5 rounded-full border transition-all ${settingsOpen ? 'bg-slate-700 border-white/20 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-white/10'}`}
          >
            {/* Badge: active settings count */}
            {Object.values(settings).filter(Boolean).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                {Object.values(settings).filter(Boolean).length}
              </span>
            )}
            <motion.svg
              className="w-5 h-5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
              animate={{ rotate: settingsOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </motion.svg>
          </button>

          {/* Session start/end */}
          {sessionActive ? (
            <button data-testid="btn-end-session" onClick={endSessionFlow} className="px-5 py-2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:text-rose-300 transition-all text-sm font-bold">
              End Session
            </button>
          ) : (
            <button data-testid="btn-start-session" onClick={handleStartClick} className="px-5 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all text-sm font-bold flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Start Session
            </button>
          )}
        </div>


      </header>

      {/* Click-away to close gear panel (below the panel itself) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
      )}

      {/* Settings panel — rendered at z-50, above the overlay, so toggles are clickable */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            className="fixed right-4 top-[72px] z-50"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
          >
            <SettingsPanel settings={settings} updateSetting={updateSetting} sessionActive={sessionActive} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <main className="flex-1 relative z-10 flex flex-col items-center overflow-y-auto pt-8 pb-40 px-4">
        {showSubtitles ? (
          <div className="w-full flex flex-col items-center">
            {messages.length === 0 && !sessionActive && !sessionClosing && (
              <div className="flex flex-col items-center justify-center mt-32 text-slate-500 opacity-60">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <p className="text-xl font-medium">Pronto para começar</p>
                <p className="text-sm">Clique em <strong>Start Session</strong> e depois segure o microfone para falar.</p>
              </div>
            )}

            <AnimatePresence>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center">
                  <MessageBubble msg={msg} showPt={settings.subtitlesPt} />
                </motion.div>
              ))}

              {liveTranscript && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                  <div className="flex w-full max-w-2xl px-4 justify-end">
                    <div className="p-4 bg-indigo-600/50 backdrop-blur-md text-white/70 rounded-3xl rounded-tr-sm border border-indigo-500/30 italic">
                      {liveTranscript}...
                    </div>
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center">
                  <LoadingBubble />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 opacity-50 mt-20">
            <svg className="w-24 h-24 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            <h3 className="text-3xl font-light tracking-tight text-white mb-2">Immersive Mode</h3>
            <p className="text-lg">Foque na escuta. As legendas estão ocultas.</p>
          </div>
        )}
      </main>

      {/* Session Closing Overlay */}
      <AnimatePresence>
        {sessionClosing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl" data-testid="session-closing-overlay">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-white/10 p-8 sm:p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🎉</div>
              <h2 className="text-3xl font-bold mb-8 text-white tracking-tight">Great session!</h2>

              <div className="space-y-6 text-left">
                {sessionClosing.strengths && sessionClosing.strengths.length > 0 && (
                  <div>
                    <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      O que você fez bem
                    </h3>
                    <ul className="text-slate-300 space-y-2">
                      {sessionClosing.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-1">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {sessionClosing.improve && (
                  <div>
                    <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Onde melhorar
                    </h3>
                    <p className="text-slate-300 ml-7">{sessionClosing.improve}</p>
                  </div>
                )}

                {sessionClosing.next_topic && (
                  <div>
                    <h3 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                      Próximo passo
                    </h3>
                    <p className="text-slate-300 ml-7">{sessionClosing.next_topic}</p>
                  </div>
                )}
              </div>

              {sessionClosing.closing_pt && (
                <div className="mt-8 pt-6 border-t border-white/5 text-sm text-slate-400 italic bg-slate-800/20 p-4 rounded-xl">
                  🇧🇷 {sessionClosing.closing_pt}
                </div>
              )}

              <button onClick={() => window.location.href = '/home'} className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20 text-white">
                Voltar para Tela Inicial
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar */}
      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-30 pb-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 pr-6 shadow-2xl shadow-indigo-900/20">

          <button
            data-testid="btn-mic"
            aria-label="Hold to record"
            onPointerDown={sessionActive ? startRecording : undefined}
            onPointerUp={sessionActive ? stopRecording : undefined}
            onPointerLeave={sessionActive ? stopRecording : undefined}
            className={`relative flex items-center justify-center w-16 h-16 rounded-full shrink-0 transition-all duration-300 ease-out shadow-lg overflow-hidden
              ${!sessionActive ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                : isRecording ? 'bg-indigo-500 text-white scale-105 shadow-indigo-500/50'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/30'}`}
          >
            {isRecording && (
              <motion.div className="absolute inset-0 rounded-full border-2 border-white/30"
                animate={{ scale: [1, 1.5], opacity: [1, 0] }} transition={{ duration: 1, repeat: Infinity }} />
            )}
            <svg className={`w-7 h-7 relative z-10 transition-transform ${isRecording ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <div className="flex-1 px-8 flex items-center justify-center min-h-[48px]">
            {isRecording ? <ActiveRecordingWaveform /> : <StandbyWaveform />}
          </div>

          <div className="text-right shrink-0 min-w-[120px]">
            <p className={`text-xs font-medium uppercase tracking-widest ${isRecording ? 'text-indigo-400' : 'text-slate-500'}`}>
              {!sessionActive ? 'OFFLINE' : isRecording ? 'Listening...' : 'Hold to Speak'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
