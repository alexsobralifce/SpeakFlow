"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isFormValid = formData.email !== '' && formData.password !== '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Credenciais inválidas.');
        setLoading(false);
        return;
      }

      // Save minimal user piece for the header widget
      if (typeof window !== 'undefined') {
        localStorage.setItem('speakflow_user', JSON.stringify({ email: formData.email }));
      }

      router.push('/home');
    } catch (err) {
      setServerError('Falha na conexão. Tente novamente mais tarde.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-slate-100">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Voltar
        </Link>

        <div className="mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/20 mx-auto mb-4">
            🎙️
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Bem-vindo(a) de volta</h1>
          <p className="text-slate-400">Entre na sua conta para continuar praticando.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-slate-900/80 backdrop-blur-xl rounded-[24px] p-8 border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {serverError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {serverError}
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="joao@exemplo.com"
                className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.01 10.01 0 015.71-2.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0l-3.29-3.29" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg text-white mt-4 flex items-center justify-center gap-2 ${isFormValid && !loading
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25 hover:scale-[1.02]'
                : 'bg-white/10 text-slate-400 cursor-not-allowed border border-white/5'
                }`}
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {isFormValid && !loading && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6 font-medium">
            Ainda não tem uma conta? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">Criar Conta</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
