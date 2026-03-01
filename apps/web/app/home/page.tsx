"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const scenarios = [
  { id: 'coffee-shop', label: '☕ Coffee Shop', description: 'Order drinks, chat with a barista' },
  { id: 'airport', label: '✈️ Airport', description: 'Check-in, ask for directions' },
  { id: 'job-interview', label: '💼 Job Interview', description: 'Introduce yourself professionally' },
  { id: 'hotel', label: '🏨 Hotel', description: 'Check in and request services' },
];

export default function HomePage() {
  const router = useRouter();

  const startSession = () => {
    const sessionId = `session-${Date.now()}`;
    router.push(`/conversation/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎙️</span>
            <span className="font-bold text-lg text-slate-900">SpeakFlow</span>
          </div>
          <Link
            href="/onboarding"
            className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
          >
            Redo Onboarding
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Ready to practice! 🌟
          </h1>
          <p className="text-lg text-slate-500">
            Start a 10-minute AI conversation session. Your tutor is waiting.
          </p>
        </div>

        {/* Quick Start CTA */}
        <div className="bg-blue-600 rounded-2xl p-8 flex items-center justify-between mb-10 shadow-lg">
          <div>
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide mb-1">Daily Session</p>
            <p className="text-white text-2xl font-bold">10 min conversation</p>
            <p className="text-blue-200 text-sm mt-1">Free talk • Intermediate level</p>
          </div>
          <button
            data-testid="btn-start-session"
            onClick={startSession}
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md text-lg"
          >
            Start Now →
          </button>
        </div>

        {/* Scenarios grid */}
        <h2 className="text-xl font-bold text-slate-800 mb-4">Choose a scenario</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {scenarios.map(({ id, label, description }) => (
            <button
              key={id}
              data-testid={`scenario-card-${id}`}
              onClick={() => router.push(`/conversation/session-${id}`)}
              className="bg-white rounded-xl p-5 border border-slate-200 text-left hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <p className="text-2xl mb-2">{label.split(' ')[0]}</p>
              <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">
                {label.replace(/^[^ ]+ /, '')}
              </p>
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
