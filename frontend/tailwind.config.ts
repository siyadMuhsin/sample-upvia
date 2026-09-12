import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    '../shared/src/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        upvia: {
          navy: '#0B1B3A',
          'navy-dark': '#071226',
          'navy-light': '#14274E',
          blue: '#1A56DB',
          'blue-hover': '#1545B0',
          cyan: '#22D3EE',
          'cyan-light': '#A5F3FC',
          mist: '#F1F5F9',
          surface: '#F8FAFC',
          secondary: '#42506B',
          border: '#E2E8F0',
          'sky-100': '#EFF6FF',
          'sky-200': '#DBEAFE',
          'sky-300': '#93C5FD',
        },
      },
      fontFamily: {
        latin: ['var(--font-archivo)', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(45deg, #1A56DB, #22D3EE)',
        'mist-gradient': 'linear-gradient(180deg, #F1F5F9 0%, #FFFFFF 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
