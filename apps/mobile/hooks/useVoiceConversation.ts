import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  corrections?: any[];
  newWords?: any[];
}

export function useVoiceConversation(sessionId: string, scenario: string, level: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    // Cleanup sound on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);

      // 1. Request Permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Microphone permission not granted!');
        return;
      }

      // 2. Configure Audio Session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // 3. Haptic Feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // 4. Start Recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);

    } catch (err: any) {
      console.error('Failed to start recording', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsLoading(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 1. Stop Recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error("No recording URI found");

      // 2. Convert to Base64
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 3. Temporary User Message
      const tempUserMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: tempUserMsgId, role: 'user', content: '...' }]);

      // 4. Fetch to API
      const response = await fetch('http://localhost:3000/api/conversation/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          sessionId,
          history: messages,
          scenario,
          level
        })
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      // 5. Update Messages with actual text and AI reply
      setMessages(prev => {
        const updated = prev.filter(m => m.id !== tempUserMsgId); // Remove temp
        return [
          ...updated,
          { id: Date.now().toString(), role: 'user', content: data.userTranscription },
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.replyText,
            corrections: data.corrections,
            newWords: data.newWords
          }
        ];
      });

      // 6. Play TTS Audio Response
      if (data.replyAudio) {
        // Ensure audio mode is back to playback
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mp3;base64,${data.replyAudio}` }
        );
        soundRef.current = sound;
        await sound.playAsync();
      }

    } catch (err: any) {
      console.error('Failed to stop recording & fetch', err);
      setError('Failed to process your turn. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRecording,
    isLoading,
    messages,
    startRecording,
    stopRecording,
    error
  };
}
