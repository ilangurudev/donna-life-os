/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom dark theme colors inspired by Obsidian
        donna: {
          bg: '#1e1e2e',
          'bg-secondary': '#181825',
          'bg-tertiary': '#11111b',
          surface: '#313244',
          'surface-hover': '#45475a',
          border: '#45475a',
          text: '#cdd6f4',
          'text-secondary': '#a6adc8',
          'text-muted': '#6c7086',
          accent: '#89b4fa',
          'accent-hover': '#b4befe',
          cyan: '#94e2d5',
          green: '#a6e3a1',
          yellow: '#f9e2af',
          red: '#f38ba8',
          purple: '#cba6f7',
          pink: '#f5c2e7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        'safe-top': 'var(--safe-area-inset-top)',
        'safe-bottom': 'var(--safe-area-inset-bottom)',
        'safe-left': 'var(--safe-area-inset-left)',
        'safe-right': 'var(--safe-area-inset-right)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'slide-in-left': 'slideInLeft 0.25s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'typewriter-cursor': 'blink 0.8s ease-in-out infinite',
        'fade-up-out': 'fadeUpOut 0.3s ease-out forwards',
        'fade-up-in': 'fadeUpIn 0.3s ease-out forwards',
        'thinking-pulse': 'thinkingPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        fadeUpOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
        fadeUpIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        thinkingPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      screens: {
        'xs': '375px',
        // Default: sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px
      },
    },
  },
  plugins: [],
}
