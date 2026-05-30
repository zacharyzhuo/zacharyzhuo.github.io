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
      fontSize: {
        // micro eyebrow / 大寫 caps 標籤統一尺寸，取代散落的 text-[10px]/[11px]
        '2xs': '0.625rem',
      },
      transitionTimingFunction: {
        // iOS26 Q 彈彈簧（對應 index.css 的 --ease-spring），可用 `ease-spring`
        spring: 'var(--ease-spring)',
        // 較柔版，給大行程面板開啟用（`ease-spring-soft`）
        'spring-soft': 'var(--ease-spring-soft)',
      },
    },
  },
  plugins: [],
}
