import { useEffect } from 'react'

const DEFAULT_TITLE = 'Trip Diaries'
const DEFAULT_DESC = '個人旅行記錄與行程規劃'

function setMeta(selector, attr, value) {
  if (value == null) return
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    const [, name] = selector.match(/\[(?:property|name)="([^"]+)"\]/) || []
    if (selector.includes('property=')) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

/**
 * 動態更新頁面 title + 基本 OG meta，方便分享連結時抓到對應內容。
 *
 * @param {{ title?: string, description?: string, image?: string }} opts
 */
export function usePageMeta({ title, description, image } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title}｜${DEFAULT_TITLE}` : DEFAULT_TITLE
    const desc = description || DEFAULT_DESC

    document.title = fullTitle
    setMeta('meta[property="og:title"]', 'content', fullTitle)
    setMeta('meta[property="og:description"]', 'content', desc)
    setMeta('meta[name="description"]', 'content', desc)
    if (image) setMeta('meta[property="og:image"]', 'content', image)
  }, [title, description, image])
}
