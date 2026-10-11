/**
 * 反方向過拉的阻尼位移（rubber-band）：越拉越難，magnitude 趨近 max 但永不超過。
 * 用於面板「往反方向拖拉時稍微被拉伸、放開彈回」的手感。
 *
 * @param {number} delta 原始手勢位移（帶正負號）
 * @param {number} [max] 阻尼後位移上限（須 < 面板單層玻璃往停駐邊延伸的距離）
 * @returns {number} 阻尼後位移
 */
export function resist(delta, max = 24) {
  const sign = Math.sign(delta)
  const abs = Math.abs(delta)
  return sign * (1 - 1 / (abs / max + 1)) * max
}

/**
 * 點 (x, y) 是否落在 rect（DOMRect 形狀：left/right/top/bottom）內。
 * 用於「按下後滑出元件範圍放開＝取消」的判定。
 *
 * @param {number} x
 * @param {number} y
 * @param {{ left: number, right: number, top: number, bottom: number }} rect
 * @returns {boolean}
 */
export function isPointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

/**
 * iOS 風格 rubber-band 阻尼：把超出邊界的 overshoot 壓成有上限、單調遞增的小位移。
 * 回傳值與 overshoot 同號，magnitude 趨近 constant 但永不超過。
 * resist() 是同一族（max 固定 24px 的面板反向拉伸版）；這個給輪播邊界等需要較大上限的場景。
 *
 * @param {number} overshoot 超出邊界的位移（帶正負號）
 * @param {number} [constant] 位移上限（px）
 */
export function rubberBand(overshoot, constant = 60) {
  return (constant * overshoot) / (constant + Math.abs(overshoot))
}

// rubberBandInverse 在 |damped| ≥ constant（數學上無解）時回傳的 overshoot 上限
const RUBBER_BAND_INVERSE_MAX = 1e6

/**
 * rubberBand 的反函式：由阻尼後位移反推原始 overshoot，
 * 使 rubberBand(rubberBandInverse(v, c), c) === v（浮點誤差內）。
 * 用於中斷邊界彈回時，把視覺位置換回 raw 起點，避免再阻尼一次。
 * |damped| ≥ constant 時無解，夾到一個很大的有限值。
 *
 * @param {number} damped 阻尼後位移（帶正負號）
 * @param {number} [constant] 與 rubberBand 相同的上限（px）
 */
export function rubberBandInverse(damped, constant = 60) {
  const abs = Math.abs(damped)
  if (abs >= constant) return Math.sign(damped) * RUBBER_BAND_INVERSE_MAX
  return (Math.sign(damped) * constant * abs) / (constant - abs)
}
