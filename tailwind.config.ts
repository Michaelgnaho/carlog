import type { Config } from 'tailwindcss';

// Change the colours here and the whole app follows.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F4F6F8',
        ink: '#0E1B2C',
        line: '#D3DAE2',
        navy: { DEFAULT: '#0F2A43', dark: '#0A1E31', soft: '#E6EEF5' },
        signal: { DEFAULT: '#F2B705', dark: '#D9A304' },
        ok: { DEFAULT: '#16794A', soft: '#E1F3E9' },
        away: { DEFAULT: '#9A5B00', soft: '#FFF1D6' },
        bad: { DEFAULT: '#B42318', soft: '#FDE8E6' },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
