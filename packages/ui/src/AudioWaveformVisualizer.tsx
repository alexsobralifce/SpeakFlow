import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AudioWaveformVisualizerProps {
  isRecording?: boolean;
  className?: string;
}

export function AudioWaveformVisualizer({ isRecording = false, className }: AudioWaveformVisualizerProps) {
  return (
    <div
      className={cn("flex items-center justify-center space-x-1 h-8", className)}
      aria-label={isRecording ? "Recording in progress" : "Microphone idle"}
      aria-live="polite"
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-semantic-error transition-all duration-300",
            isRecording
              ? (i % 3 === 0 ? "animate-waveform-1" : i % 3 === 1 ? "animate-waveform-2" : "animate-waveform-3")
              : "h-2"
          )}
        />
      ))}
    </div>
  );
}
