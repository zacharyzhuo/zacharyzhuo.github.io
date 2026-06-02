import L from 'leaflet'
import { categoryInk, BACKUP_INK } from '../../lib/categories.js'

const inkFor = (bucket) => (bucket === 'backup' ? BACKUP_INK : categoryInk(bucket))

/** 探索模式：已排點＝實心彩點；備選＝空心墨灰環。 */
export function markerIcon(bucket) {
  if (bucket === 'backup') {
    return L.divIcon({
      className: '',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      html: `<span style="display:block;width:14px;height:14px;border-radius:50%;border:2.5px solid ${BACKUP_INK};background:rgba(249,248,244,0.7);box-shadow:0 1px 3px rgba(0,0,0,0.25)"></span>`,
    })
  }
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${inkFor(bucket)};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></span>`,
  })
}

/** 路線模式：編號圓點（顏色用該點 bucket 的 ink）。 */
export function numberedIcon(bucket, n) {
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:${inkFor(bucket)};color:#fff;font:700 13px/1 'Noto Serif JP',serif;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.4)">${n}</span>`,
  })
}

/** 「我的位置」紅點（紅色＝live/現在的語意，與全站 NowMarker 一致）。 */
export function meIcon() {
  return L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:#d6453d;border:3px solid #fff;box-shadow:0 0 0 5px rgba(214,69,61,0.25)"></span>`,
  })
}
