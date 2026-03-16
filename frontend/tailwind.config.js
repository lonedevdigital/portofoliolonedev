/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'sans-serif']
      },
      boxShadow: {
        soft: '0 14px 28px -24px rgba(15, 23, 42, 0.65)',
        card: '0 24px 38px -30px rgba(15, 23, 42, 0.65)',
        glow: '0 12px 28px -18px rgba(16, 185, 129, 0.45)'
      },
      keyframes: {
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        riseIn: 'riseIn 520ms cubic-bezier(0.2, 0.8, 0.24, 1) both'
      }
    }
  },
  plugins: []
};
