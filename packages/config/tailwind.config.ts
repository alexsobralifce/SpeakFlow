import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../apps/**/*.{js,ts,jsx,tsx,mdx}", // For monorepo usage
  ],
  theme: {
    fontFamily: {
      display: ["Inter", "Plus Jakarta Sans", "DM Sans", "sans-serif"],
      body: ["Inter", "Geist", "sans-serif"],
      mono: ["JetBrains Mono", "Geist Mono", "monospace"],
    },
    extend: {
      colors: {
        background: {
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        border: "var(--color-border)",
        brand: {
          DEFAULT: "var(--color-brand)",
          hover: "var(--color-brand-hover)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "6": "24px",
        "8": "32px",
        "12": "48px",
        "16": "64px",
        "24": "96px",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        md: "0 4px 6px rgba(0,0,0,0.07)",
        lg: "0 10px 24px rgba(0,0,0,0.10)",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "waveform": {
          "0%, 100%": { height: "0.5rem" },
          "50%": { height: "1.5rem" },
        }
      },
      animation: {
        "pulse-slow": "pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "waveform-1": "waveform 1s ease-in-out infinite",
        "waveform-2": "waveform 1.2s ease-in-out infinite 0.2s",
        "waveform-3": "waveform 0.9s ease-in-out infinite 0.4s",
      }
    },
  },
  plugins: [],
};

export default config;
