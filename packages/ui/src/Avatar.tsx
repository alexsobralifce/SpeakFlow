import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface AvatarProps {
  type: "user" | "ai";
  imageUrl?: string;
  isSpeaking?: boolean;
  className?: string;
}

export function Avatar({ type, imageUrl, isSpeaking = false, className }: AvatarProps) {
  const isAI = type === "ai";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} role="img" aria-label={`${type} avatar`}>
      {isSpeaking && isAI && (
        <div className="absolute inset-0 rounded-full bg-primary-100 animate-pulse-slow scale-125" />
      )}
      <div
        className={cn(
          "relative z-10 rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-lg",
          isAI ? "bg-primary-500 text-white" : "bg-neutral-300 text-neutral-900",
          "w-12 h-12"
        )}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={type} className="w-full h-full object-cover" />
        ) : (
          <span>{isAI ? "AI" : "US"}</span>
        )}
      </div>
    </div>
  );
}
