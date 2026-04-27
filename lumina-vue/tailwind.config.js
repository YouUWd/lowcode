/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "on-surface": "#191c1d",
        "inverse-on-surface": "#f0f1f2",
        "surface-variant": "#e1e3e4",
        "tertiary-fixed-dim": "#ffb688",
        "on-surface-variant": "#404753",
        "on-error-container": "#93000a",
        "error-container": "#ffdad6",
        "tertiary": "#934600",
        "surface-dim": "#d9dadb",
        "primary-fixed": "#d4e3ff",
        "on-secondary-fixed-variant": "#3b485a",
        "on-error": "#ffffff",
        "on-tertiary": "#ffffff",
        "inverse-primary": "#a5c8ff",
        "surface": "#f8f9fa",
        "surface-container-high": "#e7e8e9",
        "on-secondary": "#ffffff",
        "on-tertiary-container": "#fffbff",
        "primary-fixed-dim": "#a5c8ff",
        "secondary": "#525f73",
        "inverse-surface": "#2e3132",
        "outline-variant": "#c0c7d6",
        "on-primary-container": "#fefcff",
        "surface-tint": "#005fae",
        "secondary-fixed-dim": "#bac7de",
        "surface-container-low": "#f3f4f5",
        "on-secondary-fixed": "#0f1c2d",
        "secondary-container": "#d6e3fb",
        "on-primary-fixed-variant": "#004785",
        "error": "#ba1a1a",
        "on-tertiary-fixed-variant": "#733600",
        "on-background": "#191c1d",
        "secondary-fixed": "#d6e3fb",
        "tertiary-fixed": "#ffdbc7",
        "surface-container": "#edeeef",
        "primary-container": "#0075d5",
        "on-tertiary-fixed": "#311300",
        "on-primary-fixed": "#001c3a",
        "background": "#f8f9fa",
        "surface-container-lowest": "#ffffff",
        "tertiary-container": "#b95a00",
        "outline": "#707785",
        "on-secondary-container": "#586579",
        "surface-container-highest": "#e1e3e4",
        "primary": "#005daa",
        "surface-bright": "#f8f9fa",
        "on-primary": "#ffffff"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "fontFamily": {
        "headline": ["Manrope", "sans-serif"],
        "display": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
