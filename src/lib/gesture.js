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
