import { Camera, Utensils, ShoppingBag, Train, Hotel } from 'lucide-react'

/**
 * 行程分類的單一 source of truth：label / icon / ink（顏色）。
 *
 * 配色為低彩度日本傳統「鼠色系」（和紙手帳調性），與品牌抹茶綠 #5C6E58 同一色族。
 * 全站任何分類標籤 / 脊線 / icon 的顏色都從這裡取，**勿再散寫 Tailwind pastel
 * （blue-700 / pink-500 …）或 raw hex**。新增分類只改這個檔。
 *
 * 抹茶綠 jp-green 保留給「全站主 accent」（連結、active、CTA、進度條、focus ring），
 * 不當分類色用；景點故意用偏黃的橄欖苔色與品牌綠區隔，避免「品牌 or 分類」的混淆。
 */
export const CATEGORIES = {
  transport:  { label: '交通', en: 'TRANSPORT',  icon: Train,        ink: '#4E6171' }, // 藍鼠 ai-nezumi
  food:       { label: '美食', en: 'FOOD',       icon: Utensils,     ink: '#9C5A43' }, // 弁柄 bengara（赤陶）
  attraction: { label: '景點', en: 'ATTRACTION', icon: Camera,       ink: '#656E3C' }, // 苔・橄欖 koke
  shopping:   { label: '購物', en: 'SHOPPING',   icon: ShoppingBag,  ink: '#8A5A6E' }, // 葡萄鼠 budou-nezumi
  hotel:      { label: '住宿', en: 'STAY',       icon: Hotel,         ink: '#5E5E86' }, // 藤鼠 fuji-nezumi
}

/** 品牌抹茶綠（= jp-green）。給 JS inline style 用（Tailwind class 不適用、需餵 chip/solid helper 時）。 */
export const BRAND_INK = '#5C6E58'

const DEFAULT_TYPE = 'attraction'

/** 取分類 meta；未知 / 空 type 退回景點（itinerary 預設類型）。 */
export function getCategory(type) {
  return CATEGORIES[type] || CATEGORIES[DEFAULT_TYPE]
}

/**
 * 任一 ink 的玻璃 chip 配色（inline style）：
 * 文字 = ink、邊框 = ink@40%、底 = ink@10%（8-digit hex alpha）。
 * 搭配 className 的 `border backdrop-blur-sm rounded ...` 結構使用。
 * 也可餵非分類色（如品牌綠）以維持一致 chip 視覺。
 */
export function chipStyle(ink) {
  return { color: ink, borderColor: `${ink}66`, backgroundColor: `${ink}1A` }
}

/** 分類標籤 / 脊線的玻璃配色（inline style）。 */
export function categoryChipStyle(type) {
  return chipStyle(getCategory(type).ink)
}

/**
 * 實心配色（inline style）：底 = ink、icon/文字 = 白。
 * 給時間軸節點、側欄 feature icon 圓底等「需要 pop」的場景；
 * 低彩度 ink 在 chip（10% 底）上會顯灰，實心才有存在感。
 */
export function solidStyle(ink) {
  return { backgroundColor: ink, color: '#ffffff' }
}

/** 分類實心配色（inline style）。 */
export function categorySolidStyle(type) {
  return solidStyle(getCategory(type).ink)
}

/** 分類 ink 純色（給 icon 色、實心圓底等用）。 */
export function categoryInk(type) {
  return getCategory(type).ink
}
