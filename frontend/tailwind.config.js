/** Queue Cure design tokens — see docs/THOUGHT_PROCESS.md "Design notes"
 *  for the reasoning behind this palette and type pairing. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F7F6',
        surface: '#FFFFFF',
        ink: '#15302B',
        primary: {
          DEFAULT: '#0E7C66',
          dark: '#0B5C4C',
          light: '#E3F2EC',
        },
        accent: {
          DEFAULT: '#E8A33D',
          dark: '#C9821F',
          light: '#FBEAD1',
        },
        slate: {
          DEFAULT: '#5B6B68',
          light: '#8A9794',
        },
        line: '#DCE3E0',
        danger: {
          DEFAULT: '#C44536',
          light: '#FBE7E3',
        },
      },
      fontFamily: {
        display: ['"Space Mono"', 'ui-monospace', 'monospace'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 48, 43, 0.04), 0 8px 24px -12px rgba(21, 48, 43, 0.12)',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '35%': { transform: 'scale(0.92) translateY(2px)', opacity: '0.55' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        flip: 'flip 0.5s ease-out',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
