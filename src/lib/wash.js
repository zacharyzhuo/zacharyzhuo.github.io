import { getCategory, BRAND_WASH } from './categories.js'

/** 四個色斑槽位的 alpha（對應 index.css body::before 的 --wash-a/b/c/d 位置）。 */
const SLOT_ALPHAS = [0.42, 0.36, 0.34, 0.34]

/**
 * 當日分類連動染：把一天的行程 rows 變成四個色斑的 rgba 色串。
 *
 * 規則：統計當天 rows 的分類組成（未知 / 空 type 同時間軸邏輯歸景點），
 * 依出現次數取前三名（同票數依首次出現順序），分配到四個槽位：
 *   3 類以上 → [c1, c2, c3, c1]
 *   2 類     → [c1, c2, c1, c2]
 *   1 類     → [c1, brand, c1, brand]（品牌綠水彩當第二色，避免單色染過重）
 *   0 列     → null（呼叫端不設變數，吃 CSS 預設水彩）
 *
 * @param {Array<{ type?: string }>} rows 當天的 itinerary rows
 * @returns {string[] | null} 四個 rgba() 色串，或 null（用預設）
 */
export function washColorsForDay(rows) {
  if (!rows || rows.length === 0) return null

  const counts = new Map()
  for (const row of rows) {
    const { wash } = getCategory(row.type)
    counts.set(wash, (counts.get(wash) || 0) + 1)
  }

  // Map 保留插入順序，sort 穩定 → 同票數依首次出現順序
  const tops = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([wash]) => wash)
    .slice(0, 3)

  const [c1, c2 = BRAND_WASH, c3 = c1] = tops
  const slots = tops.length >= 3 ? [c1, c2, c3, c1] : [c1, c2, c1, c2]

  return slots.map((rgb, i) => `rgba(${rgb}, ${SLOT_ALPHAS[i]})`)
}
