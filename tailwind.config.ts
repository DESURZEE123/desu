import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f8f9fb",
        "on-surface": "#191c1e",
        "secondary-container": "#b6c8fe",
        "on-secondary": "#ffffff",
        "surface-tint": "#0c56d0",
        "inverse-primary": "#b2c5ff",
        "surface-dim": "#d9dadc",
        "surface-container-high": "#e7e8ea",
        "on-tertiary": "#ffffff",
        "surface-variant": "#e1e2e4",
        "primary-fixed": "#dae2ff",
        secondary: "#4c5d8d",
        outline: "#737685",
        surface: "#f8f9fb",
        "on-secondary-container": "#415382",
        error: "#ba1a1a",
        "surface-container-low": "#f3f4f6",
        "primary-container": "#0052cc",
        "on-secondary-fixed": "#021945",
        "inverse-surface": "#2e3132",
        "primary-fixed-dim": "#b2c5ff",
        "on-primary-container": "#c4d2ff",
        "on-background": "#191c1e",
        "surface-bright": "#f8f9fb",
        "error-container": "#ffdad6",
        "outline-variant": "#c3c6d6",
        "on-surface-variant": "#434654",
        "surface-container-highest": "#e1e2e4",
        primary: "#003d9b",
        "on-primary": "#ffffff",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#edeef0",
        "secondary-fixed": "#dae2ff",
        "on-secondary-fixed-variant": "#344573",
        tertiary: "#7b2600",
        "on-primary-fixed-variant": "#0040a2"
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"],
        display: ["var(--font-manrope)", "var(--font-inter)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        label: ["var(--font-inter)", "sans-serif"]
      }
    }
  },
  plugins: [forms]
};

export default config;
