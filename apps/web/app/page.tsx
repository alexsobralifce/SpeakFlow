"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20">
                🎙️
              </div>
              <span className="font-bold text-xl tracking-tight text-white">SpeakFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link href="/register" className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold rounded-full transition-all hover:scale-[1.02]">
                Começar Grátis
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              O seu tutor de inglês por IA
            </div>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
            Fluência real.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Prática diária.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Perca o medo de falar inglês. Treine diálogos autênticos, receba correções em tempo real e evolua com apenas 10 minutos de prática conversacional por dia.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Link href="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-full transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] flex items-center justify-center gap-2">
              Criar Conta Grátis
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }} className="mt-16 pt-10 border-t border-white/5 flex flex-wrap justify-center gap-x-12 gap-y-6 text-slate-500 text-sm font-medium">
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 1,200+ Alunos BR</div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-indigo-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Powered by GPT-4o</div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-purple-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Áudio em tempo real</div>
          </motion.div>
        </main>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-colors">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🤖</div>
              <h3 className="text-xl font-bold text-white mb-3">Tutor Inteligente</h3>
              <p className="text-slate-400 leading-relaxed">Uma IA que se adapta ao seu nível. Fala devagar para iniciantes e usa gírias nativas para avançados.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mb-6">🔊</div>
              <h3 className="text-xl font-bold text-white mb-3">Correção de Pronúncia</h3>
              <p className="text-slate-400 leading-relaxed">Feedback fonético exato quando você errar uma palavra, com dicas em português de como posicionar a língua.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-slate-800/50 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center text-2xl mb-6">💬</div>
              <h3 className="text-xl font-bold text-white mb-3">Legendas & Sugestões</h3>
              <p className="text-slate-400 leading-relaxed">Travou na hora de responder? Ative sugestões de resposta ou traduções instantâneas para não parar a conversa.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
