"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

const levels = [
  { id: 'beginner', label: '🌱 Beginner' },
  { id: 'intermediate', label: '📘 Intermediate' },
  { id: 'advanced', label: '🚀 Advanced' },
];

const goals = [
  { id: 'travel', label: '✈️ Travel' },
  { id: 'work', label: '💼 Work' },
  { id: 'culture', label: '🎭 Culture' },
  { id: 'exams', label: '📝 Exams' },
];

const scenarios = [
  { id: 'coffee-shop', label: '☕ Coffee Shop' },
  { id: 'airport', label: '✈️ Airport' },
  { id: 'job-interview', label: '💼 Job Interview' },
  { id: 'hotel', label: '🏨 Hotel' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [level, setLevel] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [scenario, setScenario] = useState<string | null>(null);

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as Step) : s));

  const finish = () => {
    // In a real app: save to context/DB here
    router.push('/home');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Progress bar */}
      <div className="w-full max-w-md mb-8">
        <div className="flex gap-2">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-blue-600' : 'bg-blue-200'
                }`}
            />
          ))}
        </div>
        <p className="text-sm text-slate-500 mt-2">Step {step} of 3</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* STEP 1 — Level */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              What is your English level?
            </h1>
            <div className="flex flex-col gap-3">
              {levels.map(({ id, label }) => (
                <button
                  key={id}
                  data-testid={`level-${id}`}
                  onClick={() => setLevel(id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${level === id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              data-testid="btn-next"
              disabled={!level}
              onClick={next}
              className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          </>
        )}

        {/* STEP 2 — Goal */}
        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              What is your main goal?
            </h1>
            <div className="grid grid-cols-2 gap-3">
              {goals.map(({ id, label }) => (
                <button
                  key={id}
                  data-testid={`goal-${id}`}
                  onClick={() => setGoal(id)}
                  className={`px-4 py-5 rounded-xl border-2 font-medium transition-all text-center ${goal === id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              data-testid="btn-next"
              disabled={!goal}
              onClick={next}
              className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Next →
            </button>
          </>
        )}

        {/* STEP 3 — Scenario */}
        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-6">
              Pick a scenario
            </h1>
            <div className="flex flex-col gap-3">
              {scenarios.map(({ id, label }) => (
                <button
                  key={id}
                  data-testid={`scenario-${id}`}
                  onClick={() => setScenario(id)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${scenario === id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              data-testid="btn-finish"
              disabled={!scenario}
              onClick={finish}
              className="mt-6 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40 hover:bg-blue-700 transition-colors"
            >
              Start Learning 🎉
            </button>
          </>
        )}
      </div>
    </div>
  );
}
