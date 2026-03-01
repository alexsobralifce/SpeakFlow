import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export type TMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  corrections?: {
    original: string;
    corrected: string;
    rule: string;
  }[];
};

export function useConversation() {
  const [messages, setMessages] = useState<TMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [liveTranscript, setLiveTranscript] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('ai_reply_audio', async (data: { audioBase64: string, text: string }) => {
      setIsLoading(false);
      setMessages(prev => {
        if (prev[prev.length - 1]?.content === data.text) return prev;
        return [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text }];
      });

      const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
      const audio = new Audio(audioSrc);
      playbackAudioRef.current = audio;
      await audio.play();
    });

    socketRef.current.on('ai_reply_text', (data: any) => {
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].content === data.text) {
          const updated = [...prev];
          updated[updated.length - 1].corrections = data.corrections;
          return updated;
        }
        return [...prev, { id: Date.now().toString(), role: 'assistant', content: data.text, corrections: data.corrections }];
      });
    });

    socketRef.current.on('transcription_update', (data: { text: string, isFinal: boolean }) => {
      setLiveTranscript(data.text);
      if (data.isFinal) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: data.text }]);
        setLiveTranscript("");
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
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sessionActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && sessionActive) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      endSessionFlow();
    }
    return () => clearInterval(timer);
  }, [sessionActive, timeRemaining]);

  const startSessionFlow = () => {
    setSessionActive(true);
    socketRef.current?.emit('start_session', { level: 'intermediate', scenario: 'Free talk' });
  };

  const endSessionFlow = () => {
    setSessionActive(false);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    stopRecording();
    socketRef.current?.disconnect();
    setTimeRemaining(600);
  };

  const startRecording = async () => {
    try {
      if (playbackAudioRef.current) {
        playbackAudioRef.current.pause();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      socketRef.current?.emit('start_recognition_stream');

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          socketRef.current.emit('audio_data', event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      alert("Microphone permission denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioStreamRef.current?.getTracks().forEach(track => track.stop());
      socketRef.current?.emit('stop_recognition_stream');
      setIsRecording(false);
      setLiveTranscript("");
    }
  };

  const toggleSubtitles = () => {
    setShowSubtitles(prev => !prev);
  }

  return {
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
  };
}
