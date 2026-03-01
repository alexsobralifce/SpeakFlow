import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FeedbackChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: "correction" | "new-word" | "tip";
  label: string;
}

export function FeedbackChip({ variant, label, className, ...props }: FeedbackChipProps) {
  const styles = {
    correction: "bg-semantic-error/10 text-semantic-error border-semantic-error/20 hover:bg-semantic-error/20",
    "new-word": "bg-semantic-info/10 text-semantic-info border-semantic-info/20 hover:bg-semantic-info/20",
    tip: "bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20 hover:bg-semantic-warning/20",
  };

  const icons = {
    correction: (
      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    "new-word": (
      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    tip: (
      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  };

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-neutral-300",
        styles[variant],
        className
      )}
      role="note"
      {...props}
    >
      {icons[variant]}
      {label}
    </button>
  );
}
