/**
 * 求婚彩蛋「愛心開窗」過場的幾何與關鍵影格（純函式，有測試）。
 *
 * 敘事：第 9 下點擊，日期格長出一顆跟開場影片同色的藍愛心，綻放、心跳兩下；
 * 然後那顆愛心本身變成一扇窗慢慢打開，窗裡就是限時動態的第一支影片（1~8.mp4 是整面
 * 同色的藍，所以窗打開的過程看起來是「愛心本身在長大、填滿畫面」），開滿後 UI 才淡入。
 *
 * 實作：限時動態是一張靜態滿版層，只動它的 `clip-path: path(愛心)`，
 * 每一幀的 path 由 JS 算好（48 段），瀏覽器只需在相鄰、幾乎相同的 path 之間插值，
 * 不支援 path 插值的引擎也只是變成 48 格的步進，不會壞。沒有 transform、沒有反向縮放的
 * 子層，所以內容不會因為兩層動畫不同步而抖，影片也不會被重新 raster。
 */

/** 盒子邊長（px），= DayNav HeartIcon 的尺寸 */
export const HEART_SIZE = 32

/**
 * 32×32 盒子內的愛心（純 cubic bézier），DayNav 的 HeartIcon 與開窗 clip 共用同一條 path，
 * 開窗第一幀跟 icon 完全重合。
 */
export const HEART_PATH =
  'M16 28.5 C14.5 27.2 3 19.5 3 11.2 C3 6.6 6.4 3.5 10.2 3.5 C12.9 3.5 15 5 16 7.2 ' +
  'C17 5 19.1 3.5 21.8 3.5 C25.6 3.5 29 6.6 29 11.2 C29 19.5 17.5 27.2 16 28.5 Z'

/**
 * 愛心顏色 = 開場影片 1~8.mp4 **解碼後實際呈現**的整面底色（取 QuickLook 解碼幀採樣得 #95D5F5；
 * 影片製作時填的 #89CFF0 經 YUV 壓縮後顯示會偏亮）。icon、窗裡的底、影片 poster 三者同色，
 * 打開的過程才會讀成「同一個東西在長大」而不是兩顆愛心疊著。要改請重新採樣影片，勿憑設計稿填。
 */
export const HEART_COLOR = '#95D5F5'

/**
 * 從盒中心 (16,16) 量到愛心邊緣的最短距離：頂端凹陷 y=7.2 → 8.8；
 * 保守取 8.5，確保縮放後連視窗最遠的角落都在愛心內（凹陷方向也蓋得到）。
 */
const HEART_INNER_RADIUS = 8.5

/** icon 綻放（0.45s）+ 心跳兩下，之後開窗接手 */
export const BEAT_MS = 1100
/** 開窗：慢慢打開，對數空間 ease-in-out（起步輕、中段綻放、尾端穩穩收住） */
export const REVEAL_MS = 1800
/** 關窗：收回日期格 */
export const COLLAPSE_MS = 600
/** 限時動態的 UI（進度條 / 帳號 / 底欄）在窗開滿後淡入、關窗前淡出 */
export const CHROME_FADE_MS = 500

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/**
 * 計算開窗幾何：窗中心、視窗尺寸、蓋滿整個視窗所需的倍率。
 * @param {{ x: number, y: number }} center  愛心中心（viewport 座標）
 * @param {number} vw  viewport 寬
 * @param {number} vh  viewport 高
 */
export function revealGeometry(center, vw, vh) {
  const corners = [[0, 0], [vw, 0], [0, vh], [vw, vh]]
  const farthest = Math.max(...corners.map(([cx, cy]) => Math.hypot(cx - center.x, cy - center.y)))
  const scale = Math.max(1, Math.ceil(farthest / HEART_INNER_RADIUS))
  return { x: center.x, y: center.y, vw, vh, scale }
}

/**
 * 把 HEART_PATH 放大 k 倍、中心移到 (cx, cy) 後的 path 字串（viewport px 座標）。
 * HEART_PATH 只有絕對座標的 M / C / Z，數字依序是 x, y 交替，直接逐一換算即可。
 */
export function heartPathAt(cx, cy, k) {
  const half = HEART_SIZE / 2
  let i = 0
  return HEART_PATH.replace(/-?\d*\.?\d+/g, (n) => {
    const isX = i++ % 2 === 0
    const v = (Number(n) - half) * k + (isX ? cx : cy)
    return v.toFixed(2)
  })
}

/**
 * 開窗 / 關窗的 WAAPI keyframes（只動 clip-path）。倍率在「對數空間」套 ease-in-out：
 * 1 → S 是 80 倍的放大，線性空間的曲線會在前 100ms 就衝到幾十倍然後慢慢爬（爆衝）；
 * 對數空間才會像花開。
 *
 * @param {ReturnType<typeof revealGeometry>} g
 * @param {{ reverse?: boolean, steps?: number }} [opts]  reverse = 關窗（S 收回 1）
 */
export function clipKeyframes(g, { reverse = false, steps = 48 } = {}) {
  const frames = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const progress = reverse ? 1 - easeInOutCubic(t) : easeInOutCubic(t)
    const k = g.scale ** progress
    const path = `path("${heartPathAt(g.x, g.y, k)}")`
    frames.push({ clipPath: path, WebkitClipPath: path, offset: t, easing: 'linear' })
  }
  return frames
}

/** 開窗起點 / 關窗終點（32px 愛心）或全開（蓋滿）的靜態 clip style，給 React 在動畫前後 render */
export function clipStyle(g, at) {
  const path = `path("${heartPathAt(g.x, g.y, at === 'end' ? g.scale : 1)}")`
  return { clipPath: path, WebkitClipPath: path }
}
