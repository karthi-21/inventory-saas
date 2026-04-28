import ExcelJS from 'exceljs'

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportToExcel(data: {
  sheets: Array<{ name: string; headers: string[]; rows: unknown[][] }>
}, filename: string) {
  try {
    const wb = new ExcelJS.Workbook()
    for (const sheet of data.sheets) {
      const ws = wb.addWorksheet(sheet.name)
      ws.addRow(sheet.headers)
      sheet.rows.forEach((row) => ws.addRow(row))
    }
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Excel export failed:', err)
    if (data.sheets.length > 0) {
      const sheet = data.sheets[0]
      const csvData = sheet.rows.map((row) =>
        Object.fromEntries(sheet.headers.map((h, i) => [h, row[i]]))
      )
      exportToCSV(csvData, filename.replace('.xlsx', '.csv'))
    }
  }
}
