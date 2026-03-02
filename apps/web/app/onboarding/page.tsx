"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOPICS } from '@/features/conversation/components/ConversationScreen';

type Step = 1 | 2;

const levels = [
  { id: 'beginner', icon: '🌱', label: 'Iniciante', description: 'Pouco ou nenhum contato com inglês' },
  { id: 'intermediate', icon: '📘', label: 'Intermediário', description: 'Consigo me comunicar o básico' },
  { id: 'advanced', icon: '🚀', label: 'Avançado', description: 'Falo bem, busco aperfeiçoamento' },
  { id: 'expert', icon: '👑', label: 'Expert', description: 'Fluência nativa, debates complexos' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [level, setLevel] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  const next = () => setStep((s) => (s < 2 ? ((s + 1) as Step) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const finish = () => {
    if (typeof window !== 'undefined') {
      if (level) localStorage.setItem('speakflow_level', level);
      if (topic) localStorage.setItem('speakflow_topic', topic);
    }
    router.push('/home'); // Send to dashboard
  };

  const topicsForLevel = level ? TOPICS[level as keyof typeof TOPICS] || TOPICS.intermediate : [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      {/* Header & Progress */}
      <div className="w-full max-w-2xl relative z-10 mb-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            🎙️
          </div>
          <span className="font-bold text-lg tracking-tight text-white">SpeakFlow</span>
        </div>

        <div className="flex gap-2">
          {([1, 2] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-12 h-1.5 rounded-full transition-colors duration-500 ${s <= step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl relative z-10 w-full">
        <AnimatePresence mode="wait">

          {/* STEP 1 — Level */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-white/5 shadow-2xl"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                Qual o seu nível de inglês?
              </h1>
              <p className="text-slate-400 mb-8">
                Isso nos ajuda a parear nosso Tutor da melhor forma, regulando velocidade, legendas e correções.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {levels.map(({ id, icon, label, description }) => (
                  <button
                    key={id}
                    data-testid={`level-${id}`}
                    onClick={() => setLevel(id)}
                    className={`text-left p-6 rounded-2xl border-2 transition-all group ${level === id
                        ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.15)] ring-2 ring-indigo-500/20'
                        : 'bg-slate-950/50 border-white/5 hover:border-indigo-500/30 hover:bg-slate-800'
                      }`}
                  >
                    <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">{icon}</div>
                    <h3 className={`font-bold text-lg mb-1 ${level === id ? 'text-indigo-300' : 'text-slate-200'}`}>
                      {label}
                    </h3>
                    <p className="text-sm text-slate-500 leading-snug">{description}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/5">
                <button
                  data-testid="btn-next"
                  disabled={!level}
                  onClick={next}
                  className="px-10 py-4 bg-indigo-600 font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02] flex items-center gap-2"
                >
                  Continuar
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Topic */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 md:p-12 border border-white/5 shadow-2xl"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                Que tipo de assunto você prefere?
              </h1>
              <p className="text-slate-400 mb-8">
                Separamos alguns tópicos indicados para alunos de nível <span className="font-bold text-indigo-400 capitalize">{level}</span>.
              </p>

              <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto mb-8 pr-2">
                {topicsForLevel.map(t => (
                  <button
                    key={t.id}
                    data-testid={`scenario-${t.id}`}
                    onClick={() => setTopic(t.label)}
                    className={`p-5 rounded-2xl text-left border transition-all font-medium ${topic === t.label
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'bg-slate-950/50 border-white/5 text-slate-300 hover:border-indigo-500/30'
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button
                  onClick={back}
                  className="px-6 py-4 font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Voltar
                </button>
                <button
                  data-testid="btn-finish"
                  disabled={!topic}
                  onClick={finish}
                  className="px-10 py-4 bg-indigo-600 font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  Finalizar 🎉
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
