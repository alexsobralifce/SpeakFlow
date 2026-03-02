import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export type TCorrection = {
  original: string;
  corrected: string;
  rule: string;
};

export type TPronunciationTip = {
  word: string;
  phonetic: string;
  tip: string;
};

export type TSuggestion = {
  text: string;
};

export type TSessionClosing = {
  strengths: string[];
  improve: string;
  next_topic: string;
  closing_pt: string;
};

export type TMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  contentPt?: string;          // optional PT-BR translation
  corrections?: TCorrection[];
  pronunciationTips?: TPronunciationTip[];
  suggestions?: TSuggestion[];
};

export type TSessionSettings = {
  subtitlesPt: boolean;        // show AI reply in PT-BR
  suggestionsEnabled: boolean; // show suggested user responses
  pronunciationMode: boolean;  // AI gives pronunciation tips
};

export function useConversation(initialLevel: string = 'intermediate', initialTopic?: string | null) {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [sessionClosing, setSessionClosing] = useState<TSessionClosing | null>(null);
  const [settings, setSettings] = useState<TSessionSettings>({
    subtitlesPt: false,
    suggestionsEnabled: false,
    pronunciationMode: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const settingsRef = useRef<TSessionSettings>(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('ai_reply_audio', async (data: {
      audioBase64: string;
      text: string;
      textPt?: string;
      suggestions?: TSuggestion[];
    }) => {
      setIsLoading(false);
      setMessages(prev => {
        if (prev[prev.length - 1]?.content === data.text) return prev;
        return [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text,
          contentPt: data.textPt,
          suggestions: data.suggestions,
        }];
      });

      const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
      playbackAudioRef.current = audio;
      try { await audio.play(); } catch (e) { console.warn('Audio play blocked:', e); }
    });

    socketRef.current.on('ai_reply_text', (data: any) => {
      if (data.sessionClosing) {
        setSessionClosing(data.sessionClosing);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        endSessionFlow();
      }
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].content === data.text) {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            corrections: data.corrections,
            pronunciationTips: data.pronunciationTips,
          };
          return updated;
        }
        return [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.text,
          contentPt: data.textPt,
          corrections: data.corrections,
          pronunciationTips: data.pronunciationTips,
          suggestions: data.suggestions,
        }];
      });
    });

    socketRef.current.on('transcription_update', (data: { text: string; isFinal: boolean }) => {
      setLiveTranscript(data.text);
      if (data.isFinal) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: data.text }]);
        setLiveTranscript('');
      }
    });

    socketRef.current.on('ai_thinking', (isThinking: boolean) => {
      setIsLoading(isThinking);
    });

    socketRef.current.on('session_timeout', (data: { message: string }) => {
      alert(data.message);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      endSessionFlow();
    });

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      endSessionFlow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-start session if topic is pre-selected via URL
    if (initialTopic && !sessionActive && messages.length === 0) {
      startSessionFlow(initialTopic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionActive && timeRemaining > 0) {
      timer = setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (timeRemaining === 0 && sessionActive) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      endSessionFlow();
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive, timeRemaining]);

  const startSessionFlow = (topic?: string) => {
    setSessionActive(true);
    setSessionClosing(null);
    setMessages([]);
    socketRef.current?.emit('start_session', {
      level: initialLevel,
      scenario: topic || initialTopic || 'Free talk',
      settings: settingsRef.current,
    });
  };

  const endSessionFlow = () => {
    setSessionActive(false);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopRecording();
    socketRef.current?.disconnect();
    setTimeRemaining(600);
    setMessages([]);
  };

  const startRecording = async () => {
    try {
      if (playbackAudioRef.current) playbackAudioRef.current.pause();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      socketRef.current?.emit('start_recognition_stream');
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          if (socketRef.current?.connected) socketRef.current.emit('audio_data', event.data);
        }
      };
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      alert('Microphone permission denied.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
      socketRef.current?.emit('stop_recognition_stream');
      setTimeout(() => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          socketRef.current?.emit('process_audio_file', blob);
          setIsLoading(true);
        }
      }, 300);
      setIsRecording(false);
      setLiveTranscript('');
    }
  };

  const toggleSubtitles = () => setShowSubtitles(prev => !prev);

  const updateSetting = <K extends keyof TSessionSettings>(key: K, value: TSessionSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return {
    messages,
    isRecording,
    isLoading,
    showSubtitles,
    sessionActive,
    timeRemaining,
    liveTranscript,
    settings,
    sessionClosing,
    startSessionFlow,
    endSessionFlow,
    startRecording,
    stopRecording,
    toggleSubtitles,
    updateSetting,
  };
}
