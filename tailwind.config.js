/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // hover: 只在支援 hover 的裝置生效，避免觸控 tap 後 hover 樣式 sticky 卡住（如側邊欄 item 變深背景）
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        'jp-bg': '#F9F8F4',
        'jp-text': '#2C2C2C',
        'jp-green': '#5C6E58',
        'jp-red': '#B93632',
        'jp-light-gray': '#E5E5E5',
        // 語意文字/線條 token，背後吃 CSS 變數（深色模式時只改 :root 變數即可一次翻）。
        // secondary/muted 目前值 = 原 stone-600 / stone-500（零外觀變化）；jp-sub 已退役併入 muted。
        'secondary': 'var(--text-secondary)',
        'muted': 'var(--text-muted)',
        'hairline': 'var(--hairline)',
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
