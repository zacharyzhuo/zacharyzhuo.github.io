/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'jp-bg': '#F9F8F4',      // 溫暖米白背景
        'jp-text': '#2C2C2C',    // 深炭灰
        'jp-sub': '#666666',     // 次要文字
        'jp-green': '#5C6E58',   // 抹茶綠 (按鈕)
        'jp-red': '#B93632',     // 赤紅 (強調/標籤)
        'jp-light-gray': '#E5E5E5',
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', '"Hiragino Mincho ProN"', 'serif'], // 重點：明體
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
