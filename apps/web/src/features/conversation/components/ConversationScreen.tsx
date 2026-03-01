import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversation } from '../hooks/useConversation';

// In a real app, these come from @speakflow/ui
const Avatar = ({ type, isSpeaking }: any) => <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${type === 'ai' ? 'bg-indigo-500 text-white' : 'bg-gray-300'} ${isSpeaking ? 'animate-pulse' : ''}`}>{type === 'ai' ? 'AI' : 'US'}</div>;
const MessageBubble = ({ role, content, isLoading }: any) => (
  <div className={`p-4 rounded-xl max-w-[80%] mb-4 ${role === 'assistant' ? 'bg-white border text-gray-900 self-start' : 'bg-indigo-500 text-white self-end'}`}>
    {isLoading ? '...' : content}
  </div>
);
const AudioWaveformVisualizer = ({ isRecording }: any) => <div className="text-xl">{isRecording ? '🌊🌊🌊' : '---'}</div>;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function ConversationScreen() {
  const {
    messages,
    isRecording,
    isLoading,
    showSubtitles,
    sessionActive,
    timeRemaining,
    liveTranscript,
    startSessionFlow,
    endSessionFlow,
    startRecording,
    stopRecording,
    toggleSubtitles
  } = useConversation();

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
      {/* Left Column: Chat Area */}
      <div className="flex-1 flex flex-col relative w-full md:w-3/5 lg:w-2/3 border-r border-gray-200">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center">
            <Avatar type="ai" isSpeaking={isLoading} />
            <div className="ml-3">
              <h2 className="font-bold text-gray-900">Virtual Tutor</h2>
              <span data-testid="session-timer" className="text-sm text-gray-500 font-mono text-indigo-500">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            {sessionActive ? (
              <button data-testid="btn-end-session" onClick={endSessionFlow} className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded hover:bg-red-200">End Session</button>
            ) : (
              <button data-testid="btn-start-session" onClick={startSessionFlow} className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded hover:bg-green-200">Start Session</button>
            )}
            <button
              data-testid="btn-cc-toggle"
              onClick={toggleSubtitles}
              className={`px-3 py-1 text-sm font-bold rounded border ${showSubtitles ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
              {showSubtitles ? 'Hide CC' : 'Show CC'}
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto flex flex-col pt-8 space-y-2 pb-32">
          {showSubtitles ? (
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <MessageBubble role={msg.role} content={msg.content} />
                </motion.div>
              ))}
              {liveTranscript && (
                <div className="flex justify-end p-2 opacity-50 italic text-gray-600">
                  {liveTranscript}...
                </div>
              )}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <MessageBubble role="assistant" isLoading />
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col opacity-30">
              <span className="text-6xl mb-4">👂</span>
              <p className="text-xl font-bold">Listen Carefully</p>
              <p>Subtitles are turned off.</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg flex justify-center items-center h-24">
          <button
            data-testid="btn-mic"
            aria-label="Hold to record"
            onPointerDown={sessionActive ? startRecording : undefined}
            onPointerUp={sessionActive ? stopRecording : undefined}
            onPointerLeave={sessionActive ? stopRecording : undefined}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl shadow-md transition-all ${!sessionActive ? 'bg-gray-300 cursor-not-allowed' : isRecording ? 'bg-red-500 scale-110' : 'bg-indigo-500 hover:bg-indigo-600'}`}
          >
            🎤
          </button>
          <div className="absolute left-8 h-full flex items-center">
            <AudioWaveformVisualizer isRecording={isRecording} />
          </div>
          <div className="absolute right-8 text-xs text-gray-400 font-medium pb-2">
            {sessionActive ? 'Hold to Talk' : 'Start Session First'}
          </div>
        </div>
      </div>

      {/* Right Column: Real-time Feedback Panel */}
      <div className="hidden md:flex flex-col w-2/5 lg:w-1/3 bg-white p-6 overflow-y-auto">
        <h3 className="font-bold text-xl mb-6 text-gray-900 border-b pb-2">Real-time Insights</h3>

        <AnimatePresence>
          {messages.map(msg => msg.corrections?.map((c: any, i: number) => (
            <motion.div
              key={`corr-${msg.id}-${i}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-100 p-4 rounded-xl mb-4"
            >
              <div className="flex items-center text-red-600 font-bold mb-2">
                <span className="mr-2">✕</span> Correction
              </div>
              <p className="line-through text-gray-500 mb-1">{c.original}</p>
              <p className="text-gray-900 font-medium mb-3">✓ {c.corrected}</p>
              <p className="text-sm text-gray-600 bg-white p-2 rounded">{c.rule}</p>
            </motion.div>
          )))}
        </AnimatePresence>

        {messages.length <= 1 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center space-y-4 opacity-50">
            <span className="text-5xl">💡</span>
            <p>Speak clearly and hold the microphone button.<br />Corrections will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
