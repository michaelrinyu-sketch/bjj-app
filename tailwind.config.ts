import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0f0f0f',
          1: '#141414',
          2: '#1a1a1a',
          3: '#222222',
          4: '#2a2a2a',
        },
        border: {
          DEFAULT: '#2a2a2a',
          strong: '#3a3a3a',
        },
        accent: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          muted: '#7f1d1d',
        },
        muted: '#6b7280',
        belt: {
          white: '#e5e7eb',
          blue: '#2563eb',
          purple: '#7c3aed',
          brown: '#92400e',
          black: '#1c1917',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'flash-success': 'flashSuccess 0.8s ease-out forwards',
        'pop': 'pop 0.25s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        flashSuccess: {
          '0%': { backgroundColor: 'rgb(34 197 94 / 0.15)' },
          '100%': { backgroundColor: 'transparent' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
