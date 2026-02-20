/** Escape a CSV cell value — wraps in quotes if it contains commas, quotes, or newlines. */
export function csvEscape(value: string | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Build a CSV string from headers and rows. Prepends UTF-8 BOM for Excel compatibility. */
export function buildCsv(headers: string[], rows: (string | null | undefined)[][]): string {
  const lines = [headers.map(csvEscape).join(',')]
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','))
  }
  return '\uFEFF' + lines.join('\r\n')
}
