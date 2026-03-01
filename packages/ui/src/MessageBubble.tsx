import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface MessageBubbleProps {
  role: "user" | "assistant";
  content?: string;
  isError?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function MessageBubble({ role, content, isError, isLoading, className }: MessageBubbleProps) {
  const isAI = role === "assistant";

  return (
    <div
      role="article"
      aria-label={`${role} message`}
      className={cn(
        "flex w-full mb-4",
        isAI ? "justify-start" : "justify-end",
        className
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl p-4 font-body text-base shadow-sm relative",
          isAI ? "bg-white text-neutral-900 rounded-tl-sm border border-neutral-100" : "bg-primary-500 text-white rounded-tr-sm",
          isError && "bg-semantic-error text-white border-none"
        )}
      >
        {isLoading ? (
          <div className="flex space-x-2 items-center h-6">
            <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-current opacity-40 animate-bounce [animation-delay:-0.3s]" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </div>
  );
}
