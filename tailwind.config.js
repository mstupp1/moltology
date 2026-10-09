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
        // UI tightening tokens (docs/design/ui-tokens.md). Prefer these over raw hex.
        abyss: '#030708',
        surface: {
          1: '#0a1112',
          2: '#101a1c',
          3: '#172325',
          crimson: '#140a0b'
        },
        line: {
          subtle: 'rgba(150, 170, 170, 0.14)',
          DEFAULT: 'rgba(150, 170, 170, 0.26)',
          hover: 'rgba(150, 170, 170, 0.45)',
          strong: 'rgba(0, 195, 255, 0.55)'
        },
        ink: {
          DEFAULT: '#e4e9e9',
          body: '#c3cdcd',
          muted: '#8fa0a0'
        },
        benthic: {
          bg: '#070b0b',
          dim: '#030606',
          surface: '#0f1414',
          container: '#171c1c',
          high: '#262b2b',
          border: '#3a4a49',
          outline: '#839493'
        },
        cyan: {
          glow: '#00c3ff',
          bright: '#38bdf8',
          dim: '#00a3d9',
          dark: '#00374a',
          muted: '#006080',
          hover: '#3dd3ff',
          soft: 'rgba(0, 195, 255, 0.12)'
        },
        crimson: {
          aggro: '#ff453a',
          glow: '#ff5540',
          dark: '#691200',
          deep: '#5c1000',
          hover: '#ff6658',
          text: '#ff6a60',
          soft: 'rgba(255, 69, 58, 0.12)'
        },
        sacred: {
          red: '#ff453a',
          glow: '#ff6358',
          dark: '#691200',
          bg: 'rgba(255, 69, 58, 0.12)'
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        grotesk: ['Space Grotesk', 'sans-serif'],
        mono: ['Space Grotesk', 'ui-sans-serif', 'sans-serif'],
        spacemono: ['Space Grotesk', 'sans-serif'],
        cinzel: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif'],
        garamond: ['EB Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        chip: '2px',
        control: '4px',
        card: '8px',
        panel: '12px'
      },
      boxShadow: {
        menu: '0 12px 32px rgba(0, 0, 0, 0.55)',
        'sheen-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        'field-focus': '0 0 0 3px rgba(0, 195, 255, 0.18)',
        'field-error': '0 0 0 3px rgba(255, 69, 58, 0.18)',
        'hud-cyan': '0 0 15px rgba(0, 195, 255, 0.4), inset 0 0 10px rgba(0, 195, 255, 0.2)',
        'hud-cyan-lg': '0 0 30px rgba(0, 195, 255, 0.7), inset 0 0 20px rgba(0, 195, 255, 0.4)',
        'hud-red': '0 0 15px rgba(255, 69, 58, 0.6), inset 0 0 10px rgba(255, 69, 58, 0.3)',
        'hud-red-lg': '0 0 30px rgba(255, 69, 58, 0.7), inset 0 0 20px rgba(255, 69, 58, 0.4)',
        'sacred-red': '0 0 20px rgba(255, 69, 58, 0.6), inset 0 0 10px rgba(255, 69, 58, 0.3)',
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
          '50%': { filter: 'drop-shadow(0 0 18px rgba(0,255,255,1))' }
        },
        sacredPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.03)' }
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        pingSlow: {
          '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0.7' },
          '70%, 100%': { transform: 'translate(-50%, -50%) scale(2.2)', opacity: '0' }
        },
        caretBlink: {
          '0%, 49.9%': { opacity: '1' },
          '50%, 100%': { opacity: '0' }
        }
      },
      animation: {
        scanline: 'scanline 8s linear infinite',
        flicker: 'flicker 0.15s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'sacred-pulse': 'sacredPulse 4s ease-in-out infinite',
        'spin-slow': 'spinSlow 25s linear infinite',
        'ping-slow': 'pingSlow 2.5s cubic-bezier(0,0,0.2,1) infinite',
        'caret-blink': 'caretBlink 1s infinite'
      }
    },
  },
  plugins: [],
}
