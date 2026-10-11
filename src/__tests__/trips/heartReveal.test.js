import { describe, it, expect } from 'vitest'
import {
  HEART_PATH,
  HEART_SIZE,
  revealGeometry,
  heartPathAt,
  clipKeyframes,
  clipStyle,
} from '../../trips/2026-03-tokyo-hokkaido/extras/heartReveal.js'

const nums = (s) => s.match(/-?\d*\.?\d+/g).map(Number)

describe('heartReveal geometry', () => {
  it('愛心 path 只用 M / C / Z，且落在 32×32 盒內', () => {
    expect(HEART_PATH).toMatch(/^M[\d .]+(C[\d .]+)+Z$/)
    expect(Math.min(...nums(HEART_PATH))).toBeGreaterThanOrEqual(0)
    expect(Math.max(...nums(HEART_PATH))).toBeLessThanOrEqual(HEART_SIZE)
  })

  it('scale 足以讓愛心蓋到視窗最遠的角落（以內切半徑 8.5 估）', () => {
    const g = revealGeometry({ x: 60, y: 180 }, 390, 844)
    const farthest = Math.hypot(390 - 60, 844 - 180)
    expect(g.scale * 8.5).toBeGreaterThanOrEqual(farthest)
    expect(g.scale).toBeLessThan(farthest / 8.5 + 1)
  })

  it('heartPathAt(16,16,1) 與原 path 數值相同；放大 k 倍以中心為錨', () => {
    const same = nums(heartPathAt(16, 16, 1))
    nums(HEART_PATH).forEach((n, i) => expect(same[i]).toBeCloseTo(n, 2))
    const big = nums(heartPathAt(100, 200, 10))
    const orig = nums(HEART_PATH)
    // 第一個點 M16 28.5 → x 不變（16 是中心）、y = 200 + (28.5-16)*10
    expect(big[0]).toBeCloseTo(100, 2)
    expect(big[1]).toBeCloseTo(200 + (orig[1] - 16) * 10, 2)
    // 命令結構不變（可插值）
    expect(heartPathAt(100, 200, 10).replace(/-?\d*\.?\d+/g, '#')).toBe(HEART_PATH.replace(/-?\d*\.?\d+/g, '#'))
  })

  it('clipKeyframes：起點是 32px 愛心、終點蓋滿，對數空間 ease-in-out 起步輕', () => {
    const g = revealGeometry({ x: 60, y: 180 }, 390, 844)
    const kf = clipKeyframes(g)
    expect(kf[0].clipPath).toBe(clipStyle(g, 'start').clipPath)
    expect(kf.at(-1).clipPath).toBe(clipStyle(g, 'end').clipPath)
    expect(kf.every((f) => f.easing === 'linear' && f.WebkitClipPath === f.clipPath)).toBe(true)
    // 前 10% 的幀幾乎沒長（ease-in 起步）：第一個點的 y 位移相對終點 < 5%
    const y0 = nums(kf[0].clipPath)[1]
    const yEnd = nums(kf.at(-1).clipPath)[1]
    const y10 = nums(kf[Math.round(kf.length * 0.1)].clipPath)[1]
    expect((y10 - y0) / (yEnd - y0)).toBeLessThan(0.05)
  })

  it('reverse 從蓋滿收回 32px', () => {
    const g = revealGeometry({ x: 60, y: 180 }, 390, 844)
    const kf = clipKeyframes(g, { reverse: true })
    expect(kf[0].clipPath).toBe(clipStyle(g, 'end').clipPath)
    expect(kf.at(-1).clipPath).toBe(clipStyle(g, 'start').clipPath)
  })
})
