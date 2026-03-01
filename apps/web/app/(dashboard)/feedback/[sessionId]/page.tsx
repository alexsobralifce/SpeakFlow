"use client";

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock scores for this session — in a real app these come from the DB
const mockScores = {
  fluency: 78,
  vocabulary: 65,
  grammar: 82,
};

const mockCorrections = [
  { original: "I go to the store yesterday", corrected: "I went to the store yesterday", rule: "Use past simple for completed actions in the past." },
  { original: "She don't like coffee", corrected: "She doesn't like coffee", rule: "3rd person singular uses 'doesn't' in negative sentences." },
];

const mockNewWords = [
  { word: "barista", phonetic: "/bəˈriːstə/", example: "The barista made a beautiful latte art." },
  { word: "transaction", phonetic: "/trænˈzækʃən/", example: "The transaction was completed successfully." },
];

function ScoreCircle({ label, score, testId }: { label: string; score: number; testId: string }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div data-testid={testId} className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className={`text-4xl font-bold ${color}`}>{score}%</div>
      <div className="text-slate-500 font-medium text-sm uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function FeedbackPage() {
  const params = useParams();
  const sessionId = params?.sessionId ?? 'unknown';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-5xl">🏆</span>
          <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-2">Session Feedback</h1>
          <p className="text-slate-400 text-sm">Session: #{String(sessionId).slice(0, 12)}</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <ScoreCircle label="Fluency" score={mockScores.fluency} testId="score-fluency" />
          <ScoreCircle label="Vocabulary" score={mockScores.vocabulary} testId="score-vocabulary" />
          <ScoreCircle label="Grammar" score={mockScores.grammar} testId="score-grammar" />
        </div>

        {/* Corrections */}
        {mockCorrections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Corrections</h2>
            <div className="flex flex-col gap-3">
              {mockCorrections.map((c, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 p-5">
                  <p className="line-through text-slate-400 text-sm mb-1">{c.original}</p>
                  <p className="text-blue-700 font-semibold mb-2">✓ {c.corrected}</p>
                  <p className="text-xs text-slate-500 bg-slate-50 rounded p-2">{c.rule}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* New Vocabulary */}
        {mockNewWords.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-800 mb-4">New Words Learned</h2>
            <div className="flex flex-wrap gap-3">
              {mockNewWords.map((w, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <p className="font-bold text-slate-900">{w.word}</p>
                  <p className="text-xs text-blue-500">{w.phonetic}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">"{w.example}"</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/home"
            data-testid="btn-practice-again"
            className="flex-1 text-center py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Practice Again 🎙️
          </Link>
          <Link
            href="/home"
            className="flex-1 text-center py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-blue-400 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
