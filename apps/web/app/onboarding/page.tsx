"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { OnboardingChat } from '@/features/onboarding/components/OnboardingChat';

export default function OnboardingPage() {
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);

  const handleChatComplete = async (profile: any) => {
    setIsFinishing(true);

    try {
      // Save profile to backend API
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });

      if (res.ok) {
        const data = await res.json();
        // The backend calculates the level based on 'biggest_difficulty'
        if (typeof window !== 'undefined' && data.user?.level) {
          localStorage.setItem('speakflow_level', data.user.level);
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }

    // Go to dashboard
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="w-full max-w-2xl relative z-10 mb-8 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            🎙️
          </div>
          <span className="font-bold text-lg tracking-tight text-white">SpeakFlow</span>
        </div>
      </div>

      {/* Chat Component or Loading Screen */}
      {isFinishing ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-12 text-center max-w-lg w-full relative z-10 shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Preparando Seu Perfil...</h2>
          <p className="text-slate-400">A IA está processando suas respostas e calibrando seu currículo de estudos na SpeakFlow.</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl flex flex-col items-center"
        >
          <OnboardingChat onComplete={handleChatComplete} />
        </motion.div>
      )}

    </div>
  );
}
