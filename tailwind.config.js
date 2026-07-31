/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        benthic: {
          bg: '#0f1414',
          dim: '#0a0f0f',
          surface: '#1b2120',
          container: '#171c1c',
          high: '#262b2b',
          border: '#3a4a49',
          outline: '#839493'
        },
        cyan: {
          glow: '#00ffff',
          bright: '#00fbfb',
          dim: '#00dddd',
          dark: '#003737',
          muted: '#007070'
        },
        crimson: {
          aggro: '#ff0000',
          glow: '#ff5540',
          dark: '#690100',
          deep: '#5c0000'
        }
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        spacemono: ['Space Mono', 'monospace']
      },
      boxShadow: {
        'hud-cyan': '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.2)',
        'hud-cyan-lg': '0 0 25px rgba(0, 255, 255, 0.6), inset 0 0 15px rgba(0, 255, 255, 0.3)',
        'hud-red': '0 0 15px rgba(255, 0, 0, 0.5), inset 0 0 10px rgba(255, 0, 0, 0.2)',
        'chitin-plate': '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 1px 1px rgba(58, 74, 73, 0.5)'
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '70%': { opacity: '0.95' },
          '85%': { opacity: '0.75' }
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.7))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(0,255,255,1))' }
        }
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        flicker: 'flicker 0.15s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}
