/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './public/js/**/*.js', './content/**/*.json'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0B0F0C', 2: '#151B16', 3: '#222A23' },
        cream: { DEFAULT: '#F3F1EA', 2: '#E7E3D7' },
        sage: { DEFAULT: '#8A998C', dark: '#55625A' },
        lime: { DEFAULT: '#C6F432', deep: '#9BC41A' },
        error: '#FF6B5B',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter Tight"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
      },
      maxWidth: { site: '1280px' },
      transitionTimingFunction: { out: 'cubic-bezier(0.23, 1, 0.32, 1)', 'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)' },
    },
  },
  plugins: [],
};
