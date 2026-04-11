/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'jp-bg': '#F9F8F4',
        'jp-text': '#2C2C2C',
        'jp-sub': '#666666',
        'jp-green': '#5C6E58',
        'jp-red': '#B93632',
        'jp-light-gray': '#E5E5E5',
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', '"Hiragino Mincho ProN"', 'serif'],
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
