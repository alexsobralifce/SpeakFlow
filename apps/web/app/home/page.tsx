"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TOPICS } from '@/features/conversation/components/ConversationScreen';

export default function HomePage() {
  const router = useRouter();
  const [level, setLevel] = useState<string>('intermediate');
  const [topic, setTopic] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Default topic if none is selected for the current level
  useEffect(() => {
    const defaultTopicForLevel = TOPICS[level as keyof typeof TOPICS]?.[0]?.label;
    if (!topic || !TOPICS[level as keyof typeof TOPICS]?.some(t => t.label === topic)) {
      setTopic(defaultTopicForLevel || null);
    }
  }, [level, topic]);

  // Load persisted level/topic/user from original onboarding/previous sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLevel = localStorage.getItem('speakflow_level');
      const storedTopic = localStorage.getItem('speakflow_topic');
      const storedUser = localStorage.getItem('speakflow_user');

      if (storedLevel && TOPICS[storedLevel as keyof typeof TOPICS]) {
        setLevel(storedLevel);
      }
      if (storedTopic) {
        setTopic(storedTopic);
      }
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          if (userObj.email) setUserEmail(userObj.email);
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }
    }
  }, []);

  const handleLevelChange = (l: string) => {
    setLevel(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('speakflow_level', l);
    }
  };

  const handleTopicChange = (t: string) => {
    setTopic(t);
    if (typeof window !== 'undefined') {
      localStorage.setItem('speakflow_topic', t);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('speakflow_user');
      localStorage.removeItem('speakflow_level');
      localStorage.removeItem('speakflow_topic');
    }
    router.push('/');
  };

  const startSession = () => {
    if (!level || !topic) return;
    const sessionId = `session-${Date.now()}`;
    const url = `/conversation/${sessionId}?level=${level}&topic=${encodeURIComponent(topic)}`;
    router.push(url);
  };

  const currentTopics = TOPICS[level as keyof typeof TOPICS] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20">
                🎙️
              </div>
              <span className="font-bold text-xl tracking-tight text-white">SpeakFlow</span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/onboarding"
                className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors hidden sm:block"
              >
                Update Profile
              </Link>

              {/* User Profile Widget */}
              <div className="flex items-center gap-4 pl-0 sm:pl-6 border-l-0 sm:border-l border-white/10">
                <div className="flex items-center gap-3">
                  {/* Avatar Initial */}
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg shadow-inner">
                    {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                  </div>
                  {/* User Info & Level */}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-slate-200 leading-tight">
                      {userEmail || 'user@example.com'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      <p className="text-xs text-slate-400 font-medium capitalize">{level} Level</p>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Sair da conta"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all ml-1 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Ready to practice? <span className="text-indigo-400">Let's talk.</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              Start your daily 10-minute AI conversation session.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">

            {/* Sidebar Data: Quick Start */}
            <div className="lg:col-span-1 border border-white/10 bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Sua Sessão de Hoje</p>
                </div>

                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Duração</p>
                    <p className="text-white text-xl font-medium tracking-tight">10 Minutos</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Nível & Tópico Atuais</p>
                    <p className="text-indigo-300 font-medium capitalize mb-1">{level}</p>
                    <p className="text-white text-sm line-clamp-2">{topic || 'Carregando...'}</p>
                  </div>
                </div>

                <button
                  data-testid="btn-start-session"
                  disabled={!topic || !level}
                  onClick={startSession}
                  className="w-full px-8 py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 text-[17px] flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Iniciar Sessão
                </button>
              </div>
            </div>

            {/* Main Data: Level & Topic Selector */}
            <div className="lg:col-span-2 space-y-8">
              {/* Level Tabs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">1. Escolha seu Nível</h2>
                </div>
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900 border border-white/5 rounded-2xl">
                  {Object.keys(TOPICS).map(l => (
                    <button
                      key={l}
                      onClick={() => handleLevelChange(l)}
                      className={`flex-1 min-w-[100px] text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 capitalize ${level === l
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">2. Escolha o Tema</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <AnimatePresence mode="popLayout">
                    {currentTopics.map(t => (
                      <motion.button
                        key={t.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleTopicChange(t.label)}
                        data-testid={`topic-card-${t.id}`}
                        className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${topic === t.label
                          ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/20 text-indigo-100'
                          : 'bg-slate-900/40 border-white/5 text-slate-300 hover:border-indigo-500/30 hover:bg-slate-800'
                          }`}
                      >
                        <div className={`mt-0.5 shrink-0 transition-colors ${topic === t.label ? 'text-indigo-400' : 'text-slate-600'}`}>
                          {topic === t.label ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth="2" strokeDasharray="2 4" /></svg>
                          )}
                        </div>
                        <span className="font-medium text-[15px] leading-tight pt-0.5">{t.label}</span>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
