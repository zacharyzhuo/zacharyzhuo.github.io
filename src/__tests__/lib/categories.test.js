import { describe, it, expect } from 'vitest'
import {
  getCategory,
  categoryInk,
  categoryText,
  categoryWash,
  chipStyle,
  categoryChipStyle,
  solidStyle,
  categorySolidStyle,
  BRAND_INK,
  BRAND_TEXT,
  BACKUP_INK,
} from '../../lib/categories.js'
import * as categoriesModule from '../../lib/categories.js'

const TYPES = ['transport', 'food', 'attraction', 'shopping', 'hotel']

// ── WCAG 2.x contrast helpers (same formula as /private/tmp verification script) ──
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relLum([r, g, b]) {
  const toLin = (c) => {
    c = c / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const [R, G, B] = [toLin(r), toLin(g), toLin(b)]
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrast(hex1, hex2) {
  const L1 = relLum(hexToRgb(hex1))
  const L2 = relLum(hexToRgb(hex2))
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function blend(fgHex, a, bgHex) {
  const [fr, fg, fb] = hexToRgb(fgHex)
  const [br, bg, bb] = hexToRgb(bgHex)
  const r = Math.round(a * fr + (1 - a) * br)
  const g = Math.round(a * fg + (1 - a) * bg)
  const b = Math.round(a * fb + (1 - a) * bb)
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

const PAGE_BG = '#FBFAF5'
// .glass-card body (rgba(255,255,255,0.5)) composited over the washi page background.
const GLASS_CARD_BG = blend('#ffffff', 0.5, PAGE_BG)

function chipBgFor(ink) {
  // chipStyle(): backgroundColor = `${ink}1A` → alpha 0x1A/255, composited over the glass card.
  return blend(ink, 0x1a / 255, GLASS_CARD_BG)
}

describe('CATEGORIES is not a public export', () => {
  it('only exposes the documented helpers, not the raw table', () => {
    expect(categoriesModule.CATEGORIES).toBeUndefined()
  })
})

describe('category ink (non-text use) stays unchanged', () => {
  it('still returns the original brand ink per category', () => {
    expect(categoryInk('transport')).toBe('#5F8FB4')
    expect(categoryInk('food')).toBe('#C96B49')
    expect(categoryInk('attraction')).toBe('#7C9B4E')
    expect(categoryInk('shopping')).toBe('#B279A2')
    expect(categoryInk('hotel')).toBe('#7D82BC')
  })
})

describe('category text variant meets WCAG AA (>= 4.5:1)', () => {
  it.each(TYPES)('%s: categoryText passes on the page background', (type) => {
    expect(contrast(categoryText(type), PAGE_BG)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(TYPES)('%s: categoryText passes on the glass-card background', (type) => {
    expect(contrast(categoryText(type), GLASS_CARD_BG)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(TYPES)('%s: categoryText passes on its own 10%% chip tint background', (type) => {
    const ink = categoryInk(type)
    expect(contrast(categoryText(type), chipBgFor(ink))).toBeGreaterThanOrEqual(4.5)
  })

  it('unknown type falls back to attraction (same as getCategory)', () => {
    expect(categoryText('nope')).toBe(categoryText('attraction'))
  })
})

describe('categoryChipStyle uses ink for border/background and text for color', () => {
  it.each(TYPES)('%s: color is the text variant, border/background derive from ink', (type) => {
    const { ink, text } = getCategory(type)
    const style = categoryChipStyle(type)
    expect(style.color).toBe(text)
    expect(style.borderColor).toBe(`${ink}66`)
    expect(style.backgroundColor).toBe(`${ink}1A`)
  })
})

describe('chipStyle', () => {
  it('defaults text color to ink when no text variant is given (back-compat)', () => {
    expect(chipStyle('#123456')).toEqual({
      color: '#123456',
      borderColor: '#12345666',
      backgroundColor: '#1234561A',
    })
  })

  it('uses the explicit text color when given, independent of the ink used for border/background', () => {
    expect(chipStyle('#123456', '#000000')).toEqual({
      color: '#000000',
      borderColor: '#12345666',
      backgroundColor: '#1234561A',
    })
  })
})

describe('solidStyle / categorySolidStyle (non-text background) still use ink', () => {
  it.each(TYPES)('%s: solid background is ink, text stays white', (type) => {
    expect(categorySolidStyle(type)).toEqual(solidStyle(categoryInk(type)))
    expect(categorySolidStyle(type).backgroundColor).toBe(categoryInk(type))
  })
})

describe('BRAND_TEXT (jp-green text variant)', () => {
  it('passes WCAG AA on the page and glass-card backgrounds', () => {
    expect(contrast(BRAND_TEXT, PAGE_BG)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(BRAND_TEXT, GLASS_CARD_BG)).toBeGreaterThanOrEqual(4.5)
  })

  it('BRAND_INK itself is left unchanged (non-text uses still get the original green)', () => {
    expect(BRAND_INK).toBe('#5E8C61')
  })
})

describe('BACKUP_INK already clears AA on its own, no text variant needed', () => {
  it('passes 4.5:1 on the page background as-is', () => {
    expect(contrast(BACKUP_INK, PAGE_BG)).toBeGreaterThanOrEqual(4.5)
  })
})
