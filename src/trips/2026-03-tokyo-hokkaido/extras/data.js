import { env } from '../../../lib/env.js'

const BASE = env.BASE_URL

// 彩蛋媒體：圖片 AVIF（原 iPhone JPEG 以 q80 轉檔，像素尺寸 1179×2096 不縮）、影片 .mp4；BGM 見 extras.jsx 的 BGM_URL
export const PROPOSAL_PHOTOS = [
  `${BASE}proposal-photos/1.mp4`,
  `${BASE}proposal-photos/2.mp4`,
  `${BASE}proposal-photos/3.mp4`,
  `${BASE}proposal-photos/4.mp4`,
  `${BASE}proposal-photos/5.mp4`,
  `${BASE}proposal-photos/6.mp4`,
  `${BASE}proposal-photos/7.mp4`,
  `${BASE}proposal-photos/8.mp4`,
  `${BASE}proposal-photos/9.avif`,
  `${BASE}proposal-photos/10.avif`,
  `${BASE}proposal-photos/11.avif`,
  `${BASE}proposal-photos/12.avif`,
  `${BASE}proposal-photos/13.mp4`,
  `${BASE}proposal-photos/14.avif`,
  `${BASE}proposal-photos/15.avif`,
  `${BASE}proposal-photos/16.avif`,
  `${BASE}proposal-photos/17.avif`,
  `${BASE}proposal-photos/18.avif`,
  `${BASE}proposal-photos/19.avif`,
  `${BASE}proposal-photos/20.mp4`,
  `${BASE}proposal-photos/21.avif`,
  `${BASE}proposal-photos/22.avif`,
  `${BASE}proposal-photos/23.avif`,
  `${BASE}proposal-photos/24.avif`,
  `${BASE}proposal-photos/25.avif`,
  `${BASE}proposal-photos/26.avif`,
  `${BASE}proposal-photos/27.avif`,
  `${BASE}proposal-photos/28.avif`,
  `${BASE}proposal-photos/29.avif`,
  `${BASE}proposal-photos/30.avif`,
  `${BASE}proposal-photos/31.avif`,
  `${BASE}proposal-photos/32.avif`,
  `${BASE}proposal-photos/33.avif`,
  `${BASE}proposal-photos/34.avif`,
  `${BASE}proposal-photos/35.avif`,
  `${BASE}proposal-photos/36.avif`,
  `${BASE}proposal-photos/37.avif`,
  `${BASE}proposal-photos/38.mp4`,
]

export const SHARE_CONTACTS = [
  {
    name: 'Angelet Y.',
    avatar: `${BASE}proposal-photos/angelet.jpg`,
  },
]

export const isVideoUrl = (url) => /\.(mov|mp4|webm)(\?|$)/i.test(url || '')
