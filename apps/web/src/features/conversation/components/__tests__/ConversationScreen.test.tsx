import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ConversationScreen } from '../ConversationScreen';
import * as useConversationModule from '../../hooks/useConversation';

// Mock the hook
vi.mock('../../hooks/useConversation');

describe('ConversationScreen Component', () => {
  const mockStartSessionFlow = vi.fn();
  const mockEndSessionFlow = vi.fn();
  const mockStartRecording = vi.fn();
  const mockStopRecording = vi.fn();
  const mockToggleSubtitles = vi.fn();

  const defaultMockState = {
    messages: [],
    isRecording: false,
    isLoading: false,
    showSubtitles: true,
    sessionActive: false,
    timeRemaining: 600,
    liveTranscript: "",
    startSessionFlow: mockStartSessionFlow,
    endSessionFlow: mockEndSessionFlow,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    toggleSubtitles: mockToggleSubtitles
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    useConversationModule.useConversation.mockReturnValue(defaultMockState);
  });

  it('renders initial state correctly', () => {
    // @ts-ignore
    useConversationModule.useConversation.mockReturnValue(defaultMockState);
    render(<ConversationScreen />);

    // Check initial timer
    expect(screen.getByText('10:00')).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText('Start Session')).toBeInTheDocument();
    expect(screen.getByText('Hide CC')).toBeInTheDocument();
    expect(screen.getByText('Start Session First')).toBeInTheDocument();
  });

  it('displays end session when active', () => {
    // @ts-ignore
    useConversationModule.useConversation.mockReturnValue({
      ...defaultMockState,
      sessionActive: true,
    });

    render(<ConversationScreen />);

    expect(screen.getByText('End Session')).toBeInTheDocument();
    expect(screen.getByText('Hold to Talk')).toBeInTheDocument();
  });

  it('triggers start session on click', () => {
    render(<ConversationScreen />);

    const btn = screen.getByText('Start Session');
    fireEvent.click(btn);

    expect(mockStartSessionFlow).toHaveBeenCalledTimes(1);
  });
});
