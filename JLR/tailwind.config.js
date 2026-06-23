/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F7F1E6',
          glow: '#FFF8ED',
          deep: '#EFE1CD',
        },
        card: {
          DEFAULT: 'rgba(255,255,255,0.45)',
          border: '#D8C4A8',
          soft: 'rgba(255,253,248,0.75)',
        },
        ink: {
          DEFAULT: '#3A2C22',
          label: '#5D4634',
          body: '#8C8176',
          faint: '#9B9087',
          placeholder: '#B3A79B',
        },
        gold: {
          DEFAULT: '#9B6A43',
          dark: '#8A5D3B',
          bright: '#C8A45D',
          eyebrow: '#9A6A42',
        },
        terracotta: {
          DEFAULT: '#A9744F',
        },
        flare: {
          DEFAULT: '#B9513F',
          dim: '#D86A55',
        },
      },
      fontFamily: {
        display: ['"Archivo"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        num: ['"Roboto Mono"', 'monospace'],
        mark: ['"Archivo"', 'sans-serif'],
      },
      borderRadius: {
        card: '2rem',
      },
      boxShadow: {
        card: '0 25px 50px -12px rgba(122,78,47,0.10)',
        button: '0 20px 25px -10px rgba(155,106,67,0.25)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.4 },
        },
        riseIn: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
        riseIn: 'riseIn 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
