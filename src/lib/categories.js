import { Camera, Utensils, ShoppingBag, Train, Hotel } from 'lucide-react'

/**
 * 行程分類的單一 source of truth：label / icon / ink（顏色）+ wash（背景染色水彩）。
 *
 * 配色為「明るい日本傳統色」（2026-06 由低彩鼠色系全族提彩提亮：
 * 低彩色配毛玻璃容易整面灰 —— blur 把背後顏色平均、低彩一平均就趨灰）。
 * 全站任何分類標籤 / 脊線 / icon 的顏色都從這裡取，**勿再散寫 Tailwind pastel
 * （blue-700 / pink-500 …）或 raw hex**。新增分類只改這個檔。
 *
 * jp-green（明るい抹茶 #5E8C61）保留給「全站主 accent」（連結、active、CTA、進度條、
 * focus ring），不當分類色用；景點用偏黃的若葉與品牌綠區隔，避免「品牌 or 分類」混淆。
 *
 * `wash` 是該分類的高明度水彩版（'R, G, B' 字串，給背景染色 rgba 組裝用）。
 * ⚠️ 染色不可直接用 ink：ink 是文字色（明度低），當染色拉濃會讀成髒灰陰影。
 */
export const CATEGORIES = {
  transport:  { label: '交通', en: 'TRANSPORT',  icon: Train,        ink: '#5F8FB4', wash: '150, 185, 215' }, // 縹 hanada
  food:       { label: '美食', en: 'FOOD',       icon: Utensils,     ink: '#C96B49', wash: '240, 172, 140' }, // 朱 aka（明るい弁柄）
  attraction: { label: '景點', en: 'ATTRACTION', icon: Camera,       ink: '#7C9B4E', wash: '178, 206, 138' }, // 若葉 wakaba
  shopping:   { label: '購物', en: 'SHOPPING',   icon: ShoppingBag,  ink: '#B279A2', wash: '218, 170, 204' }, // 紅藤 benifuji
  hotel:      { label: '住宿', en: 'STAY',       icon: Hotel,         ink: '#7D82BC', wash: '176, 180, 232' }, // 藤紫 fujimurasaki
}

/** 品牌綠（= jp-green，明るい抹茶）。給 JS inline style 用（Tailwind class 不適用、需餵 chip/solid helper 時）。 */
export const BRAND_INK = '#5E8C61'

/** 品牌綠的水彩版（背景染色用，同 CATEGORIES[*].wash 格式）。 */
export const BRAND_WASH = '150, 200, 164'

/**
 * 備選點（itinerary 空 date）在地圖上的顏色：中性墨灰（利休鼠調）。
 * 刻意「非品牌綠、非任何分類色」，搭配空心環 marker 讀作「候選、尚未鎖定」。
 */
export const BACKUP_INK = '#6B6B66'

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
