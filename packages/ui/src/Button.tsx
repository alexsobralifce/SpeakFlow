import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "icon-only";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  isLoading = false,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-display rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 px-6 py-3 font-semibold",
    secondary: "bg-secondary-100 text-secondary-500 hover:bg-secondary-100/80 focus:ring-secondary-500 px-6 py-3 font-semibold",
    ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100 focus:ring-neutral-300 px-6 py-3 font-medium",
    "icon-only": "p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading}
      aria-disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {!isLoading && variant === "icon-only" ? children : isLoading && variant === "icon-only" ? null : children}
    </button>
  );
}
