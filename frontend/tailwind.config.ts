import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080C14",
        surface: "#0D1527",
        "surface-raised": "#131F38",
        border: "rgba(255, 255, 255, 0.08)",
        "border-glow": "rgba(0, 240, 255, 0.2)",
        cyan: {
          400: "#38BDF8",
          500: "#00F0FF",
          600: "#0284C7",
        },
        state: {
          verified: "#10B981",    // Green
          inferred: "#38BDF8",    // Cyan
          conflicting: "#F59E0B", // Amber
          missing: "#EF4444",     // Red
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glow-cyan": "0 0 20px rgba(0, 240, 255, 0.25)",
        "glow-green": "0 0 20px rgba(16, 185, 129, 0.25)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.25)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.25)",
      }
    },
  },
  plugins: [],
};

export default config;
