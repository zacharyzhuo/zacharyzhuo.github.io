import { HEART_PATH, HEART_SIZE, HEART_COLOR } from './heartReveal.js'

/**
 * DayNav 日期格裡的彩蛋愛心。用與開窗過場相同的 HEART_PATH 畫、同一個 HEART_COLOR（= 開場影片底色），
 * 所以過場第一幀的「窗」跟這顆 icon 完全重合，看起來是同一個東西被打開。
 * activated 時綻放 + 心跳兩下（.animate-heart-bloom-beat），BEAT_MS 後由 ProposalModal 開窗接手。
 */
export default function HeartIcon({ activated, hidden = false }) {
  return (
    <svg
      width={HEART_SIZE}
      height={HEART_SIZE}
      viewBox={`0 0 ${HEART_SIZE} ${HEART_SIZE}`}
      className={activated ? 'animate-heart-bloom-beat' : ''}
      // hidden：開窗起跑那刻由 ProposalModal 透過 onRevealStart 要求隱藏，畫面上只剩「窗」這一顆愛心，
      // 不會 icon 與窗（影片的藍有壓縮色差）疊在一起看成兩顆
      style={{ transformOrigin: 'center', display: 'block', visibility: hidden ? 'hidden' : 'visible' }}
      aria-hidden="true"
      focusable="false"
    >
      <path d={HEART_PATH} fill={HEART_COLOR} />
    </svg>
  )
}
