import { describe, it, expect } from 'vitest'
import { parseCSV, sheetURL } from '../../lib/sheets.js'

describe('parseCSV', () => {
  it('returns empty array for empty string', () => {
    expect(parseCSV('')).toEqual([])
  })

  it('returns empty array when only header row exists', () => {
    expect(parseCSV('"name","date"')).toEqual([])
  })

  it('parses simple quoted CSV', () => {
    const csv = '"name","date"\n"福岡","2026-01"'
    expect(parseCSV(csv)).toEqual([{ name: '福岡', date: '2026-01' }])
  })

  it('parses multiple rows', () => {
    const csv = '"a","b"\n"1","2"\n"3","4"'
    expect(parseCSV(csv)).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ])
  })

  it('handles commas inside quoted fields', () => {
    const csv = '"name","note"\n"A, B","has comma"'
    expect(parseCSV(csv)).toEqual([{ name: 'A, B', note: 'has comma' }])
  })

  it('handles escaped double quotes ("")', () => {
    const csv = '"name"\n"He said ""hi"""'
    expect(parseCSV(csv)).toEqual([{ name: 'He said "hi"' }])
  })

  it('handles empty fields', () => {
    const csv = '"a","b","c"\n"val","",""'
    expect(parseCSV(csv)).toEqual([{ a: 'val', b: '', c: '' }])
  })

  it('trims header whitespace', () => {
    const csv = '" name "," date "\n"foo","bar"'
    expect(parseCSV(csv)).toEqual([{ name: 'foo', date: 'bar' }])
  })
})

describe('sheetURL', () => {
  it('builds correct URL', () => {
    expect(sheetURL('ABC123', 'flights')).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/gviz/tq?tqx=out:csv&sheet=flights'
    )
  })

  it('URL-encodes tab names with spaces', () => {
    expect(sheetURL('ABC123', 'my sheet')).toBe(
      'https://docs.google.com/spreadsheets/d/ABC123/gviz/tq?tqx=out:csv&sheet=my%20sheet'
    )
  })
})
