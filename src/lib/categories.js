import { Camera, Utensils, ShoppingBag, Train, Hotel } from 'lucide-react'

/**
 * 行程分類的單一 source of truth：label / icon / ink（顏色）+ wash（背景染色水彩）+ text（文字色）。
 *
 * 配色為「明るい日本傳統色」（2026-06 由低彩鼠色系全族提彩提亮：
 * 低彩色配毛玻璃容易整面灰 —— blur 把背後顏色平均、低彩一平均就趨灰）。
 * 全站任何分類標籤 / 脊線 / icon 的顏色都從這裡取，**勿再散寫 Tailwind pastel
 * （blue-700 / pink-500 …）或 raw hex**。新增分類只改這個檔。
 *
 * jp-green（明るい抹茶 #5E8C61）保留給「全站主 accent」（連結、active、CTA、進度條、
 * focus ring），不當分類色用；景點用偏黃的若葉與品牌綠區隔，避免「品牌 or 分類」混淆。
 *
 * `wash` 是該分類的高明度水彩版（'R, G, B' 字串），給行程卡背後的
 * 「分類色光暈」（ItinerarySection）組 rgba 用。
 * ⚠️ 光暈/染色不可直接用 ink：ink 是文字色（明度低），拉濃會讀成髒灰陰影。
 *
 * `text` 是 `ink` 同色相 / 飽和度、拉低明度到 WCAG AA（4.5:1）的文字專用版本
 * （2026-10 對比健檢：`ink` 原本當 10px/14px 小字用只有 3.0–3.5:1，不合格）。
 * ⚠️ `ink` 保留給非文字用途（icon、脊線、marker、chip 邊框/底色 — 這些只要
 * 3:1 或無要求），**任何渲染成文字字元的顏色一律改用 `text`**，`ink` 不變。
 * 兩者數值已針對 #FBFAF5 頁面底色與 `.glass-card`（0.5 白疊底）、以及
 * chipStyle 的 10% ink 染色 chip 底，實測 >= 4.5:1（見
 * src/__tests__/categories.test.js 的 contrast 測試）。
 */
const CATEGORIES = {
  transport:  { label: '交通', en: 'TRANSPORT',  icon: Train,        ink: '#5F8FB4', text: '#416A8A', wash: '150, 185, 215' }, // 縹 hanada
  food:       { label: '美食', en: 'FOOD',       icon: Utensils,     ink: '#C96B49', text: '#AC5333', wash: '240, 172, 140' }, // 朱 aka（明るい弁柄）
  attraction: { label: '景點', en: 'ATTRACTION', icon: Camera,       ink: '#7C9B4E', text: '#5E753B', wash: '178, 206, 138' }, // 若葉 wakaba
  shopping:   { label: '購物', en: 'SHOPPING',   icon: ShoppingBag,  ink: '#B279A2', text: '#985886', wash: '218, 170, 204' }, // 紅藤 benifuji
  hotel:      { label: '住宿', en: 'STAY',       icon: Hotel,         ink: '#7D82BC', text: '#6167AE', wash: '176, 180, 232' }, // 藤紫 fujimurasaki
}

/** 品牌綠（= jp-green，明るい抹茶）。給 JS inline style 用（Tailwind class 不適用、需餵 chip/solid helper 時）。
 *  非文字用途（icon、ring、虛線、分隔線）用這個；文字用途改用下方 `BRAND_TEXT`。 */
export const BRAND_INK = '#5E8C61'

/** `BRAND_INK` 的文字版（同色相拉低明度到 4.5:1，見 categories.js 檔頭 `text` 欄位說明）。
 *  數值須與 `index.css` 的 `--jp-green-text` 及 `tailwind.config.js` 的 `jp-green-text` 保持一致
 *  （本站既有慣例：BRAND_INK 本身也是獨立散寫在這三個檔，非單一 CSS var 源頭）。 */
export const BRAND_TEXT = '#547C56'

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
 * 邊框 = ink@40%、底 = ink@10%（8-digit hex alpha，維持原分類識別色）；
 * 文字 = `text`（ink 的 4.5:1 文字版，未帶則退回 ink 本身，給非分類色呼叫端相容）。
 * 搭配 className 的 `border backdrop-blur-sm rounded ...` 結構使用。
 */
export function chipStyle(ink, text = ink) {
  return { color: text, borderColor: `${ink}66`, backgroundColor: `${ink}1A` }
}

/** 分類標籤 chip 配色（inline style）：邊框/底用 ink，文字用 4.5:1 的 text 變體。 */
export function categoryChipStyle(type) {
  const { ink, text } = getCategory(type)
  return chipStyle(ink, text)
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

/** 分類 ink 純色（給 icon 色、實心圓底、脊線等**非文字**用途；3:1 即可，勿用於文字）。 */
export function categoryInk(type) {
  return getCategory(type).ink
}

/** 分類文字色（ink 同色相的 4.5:1 版本）。**任何渲染成文字字元的分類色一律用這個**（eyebrow、label、chip 文字…）。 */
export function categoryText(type) {
  return getCategory(type).text
}

/** 分類水彩色（'R, G, B' 字串），給卡片背後的分類色光暈組 rgba 用。 */
export function categoryWash(type) {
  return getCategory(type).wash
}
