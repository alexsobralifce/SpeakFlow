import { renderHook, act } from '@testing-library/react-native';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

// Mock dependencies
jest.mock('expo-av');
jest.mock('expo-file-system');
jest.mock('expo-haptics');

global.fetch = jest.fn();

describe('useVoiceConversation hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Audio.Recording.createAsync as jest.Mock).mockResolvedValue({
      recording: {
        stopAndUnloadAsync: jest.fn(),
        getURI: jest.fn().mockReturnValue('file://test.wav'),
      }
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue('mock-base64-audio');
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useVoiceConversation('sess-1', 'Cafe', 'beginner'));

    expect(result.current.isRecording).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should start recording successfully', async () => {
    const { result } = renderHook(() => useVoiceConversation('sess-1', 'Cafe', 'beginner'));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalled();
    expect(Audio.Recording.createAsync).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set an error if mic permission is denied', async () => {
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useVoiceConversation('sess-1', 'Cafe', 'beginner'));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.error).toBe('Microphone permission not granted!');
  });

  it('should stop recording, fetch from API, and append messages', async () => {
    // Setup successful fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        userTranscription: 'Hello',
        replyText: 'Hi there',
        replyAudio: 'mock-reply-audio-base64',
        corrections: [],
        newWords: []
      })
    });

    // Mock Sound creation for TTS playback
    const playAsyncMock = jest.fn();
    (Audio.Sound.createAsync as jest.Mock).mockResolvedValue({
      sound: { playAsync: playAsyncMock }
    });

    const { result } = renderHook(() => useVoiceConversation('sess-1', 'Cafe', 'beginner'));

    // Start
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);

    // Stop
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/conversation/turn', expect.anything());
    expect(result.current.messages.length).toBe(2); // 1 User + 1 AI
    expect(result.current.messages[0].content).toBe('Hello');
    expect(result.current.messages[1].content).toBe('Hi there');
    expect(playAsyncMock).toHaveBeenCalled();
  });
});
