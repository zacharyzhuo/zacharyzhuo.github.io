/**
 * 解析 Google Sheets gviz/tq CSV 格式
 * 支援跨行 cell（欄位值含換行符的情況）
 * 第一行為 header，其後每行為一筆資料
 */
export function parseCSV(text) {
  const trimmed = text.trim()
  if (!trimmed) return []

  const rows = parseRows(trimmed)
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim())
  return rows.slice(1).map(row => {
    return Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
  })
}

function parseRows(text) {
  const rows = []
  let row = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current)
      current = ''
    } else if (ch === '\n' && !inQuotes) {
      row.push(current)
      rows.push(row)
      row = []
      current = ''
    } else if (ch === '\r') {
      // skip \r，相容 Windows \r\n
    } else {
      current += ch
    }
  }

  row.push(current)
  if (row.some(f => f !== '')) rows.push(row)

  return rows
}

/**
 * 建立 Google Sheets public CSV 端點 URL
 */
export function sheetURL(sheetId, tabName) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`
}
