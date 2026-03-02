"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

export type TMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

interface OnboardingChatProps {
  onComplete: (profile: any) => void;
}

export function OnboardingChat({ onComplete }: OnboardingChatProps) {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(true); // initially true while connecting

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    // Connect to websocket
    socketRef.current = io();

    socketRef.current.on('connect', () => {
      // Start onboarding session
      socketRef.current?.emit('start_session', { mode: 'onboarding' });
    });

    socketRef.current.on('ai_reply_text', (data: any) => {
      setIsTyping(false);

      // Prevent duplicates if audio comes first (though text usually comes with audio via ai_reply_audio or independently)
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].content === data.text) return prev;
        return [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }];
      });

      if (data.profile) {
        onComplete(data.profile);
      }
    });

    socketRef.current.on('ai_reply_audio', (data: any) => {
      setIsTyping(false);
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].content === data.text) return prev;
        return [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }];
      });

      // Play audio directly
      const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
      audio.play().catch(e => console.warn('Audio play blocked:', e));
    });

    socketRef.current.on('ai_thinking', (thinking: boolean) => {
      setIsTyping(thinking);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [onComplete]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage: TMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    socketRef.current?.emit('text_message', inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-[24px] shadow-2xl overflow-hidden relative z-10">

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg shadow-lg shadow-indigo-500/20 relative">
            AI
            {isTyping && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>}
          </div>
          <div>
            <h2 className="text-white font-semibold">Assistente SpeakFlow</h2>
            <p className="text-xs text-slate-400">Personalizando seu perfil</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-white/5 shadow-md'
                  }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1.5 shadow-md">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/90 border-t border-white/5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua resposta..."
            className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-5 py-3.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-12 h-12 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white fill-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">
          Converse com a IA para personalizar sua jornada. Responda do seu jeito!
        </p>
      </div>
    </div>
  );
}
