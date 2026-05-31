import { env } from '../../../lib/env.js'

const BASE = env.BASE_URL

// 彩蛋媒體：圖片 JPEG/WebP，影片 .mov/.mp4
export const PROPOSAL_PHOTOS = [
  `${BASE}proposal-photos/1.mp4`,
  `${BASE}proposal-photos/2.mp4`,
  `${BASE}proposal-photos/3.mp4`,
  `${BASE}proposal-photos/4.mp4`,
  `${BASE}proposal-photos/5.mp4`,
  `${BASE}proposal-photos/6.mp4`,
  `${BASE}proposal-photos/7.mp4`,
  `${BASE}proposal-photos/8.mp4`,
  `${BASE}proposal-photos/9.JPG`,
  `${BASE}proposal-photos/10.JPG`,
  `${BASE}proposal-photos/11.JPG`,
  `${BASE}proposal-photos/12.JPG`,
  `${BASE}proposal-photos/13.mp4`,
  `${BASE}proposal-photos/14.JPG`,
  `${BASE}proposal-photos/15.JPG`,
  `${BASE}proposal-photos/16.JPG`,
  `${BASE}proposal-photos/17.JPG`,
  `${BASE}proposal-photos/18.JPG`,
  `${BASE}proposal-photos/19.JPG`,
  `${BASE}proposal-photos/20.mp4`,
  `${BASE}proposal-photos/21.JPG`,
  `${BASE}proposal-photos/22.JPG`,
  `${BASE}proposal-photos/23.JPG`,
  `${BASE}proposal-photos/24.JPG`,
  `${BASE}proposal-photos/25.JPG`,
  `${BASE}proposal-photos/26.JPG`,
  `${BASE}proposal-photos/27.JPG`,
  `${BASE}proposal-photos/28.JPG`,
  `${BASE}proposal-photos/29.JPG`,
  `${BASE}proposal-photos/30.JPG`,
  `${BASE}proposal-photos/31.JPG`,
  `${BASE}proposal-photos/32.JPG`,
  `${BASE}proposal-photos/33.JPG`,
  `${BASE}proposal-photos/34.JPG`,
  `${BASE}proposal-photos/35.JPG`,
  `${BASE}proposal-photos/36.JPG`,
  `${BASE}proposal-photos/37.JPG`,
  `${BASE}proposal-photos/38.mp4`,
]

export const SHARE_CONTACTS = [
  {
    name: 'Angelet Y.',
    avatar: `${BASE}proposal-photos/angelet.jpg`,
  },
]

export const isVideoUrl = (url) => /\.(mov|mp4|webm)(\?|$)/i.test(url || '')
