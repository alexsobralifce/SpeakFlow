import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FluencyProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  className?: string;
}

export function FluencyProgressBar({ progress, label = "Fluency Score", className }: FluencyProgressBarProps) {
  const boundedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-neutral-600 font-display">{label}</span>
        <span className="text-sm font-bold text-secondary-500 font-display">{boundedProgress}%</span>
      </div>
      <div
        className="w-full h-3 bg-secondary-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={boundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-secondary-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${boundedProgress}%` }}
        />
      </div>
    </div>
  );
}
