/**
 * Excel Export Utility
 * Uses exceljs to export data to .xlsx files with multiple sheets
 */
import ExcelJS from 'exceljs'

export interface ExcelSheet {
  name: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

export async function exportToExcel(sheets: ExcelSheet[], filename: string) {
  const wb = new ExcelJS.Workbook()

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name)
    ws.addRow(sheet.headers)
    sheet.rows.forEach((row) => ws.addRow(row))

    // Set column widths based on header length
    sheet.headers.forEach((h, i) => {
      const col = ws.getColumn(i + 1)
      col.width = Math.max(h.length + 2, 12)
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Export sales report to Excel
 */
export function exportSalesReport(
  dailySales: Array<{
    date: string
    invoices: number
    revenue: number
    paid: number
    due: number
    gst: number
  }>,
  filename = 'sales-report'
) {
  exportToExcel(
    [
      {
        name: 'Daily Sales',
        headers: ['Date', 'Bills', 'Revenue (₹)', 'Paid (₹)', 'Amount Due (₹)', 'GST (₹)'],
        rows: dailySales.map((d) => [d.date, d.invoices, d.revenue, d.paid, d.due, d.gst]),
      },
      {
        name: 'Summary',
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Bills', dailySales.reduce((s, d) => s + d.invoices, 0)],
          ['Total Revenue', dailySales.reduce((s, d) => s + d.revenue, 0)],
          ['Total Paid', dailySales.reduce((s, d) => s + d.paid, 0)],
          ['Total Amount Due', dailySales.reduce((s, d) => s + d.due, 0)],
          ['Total GST', dailySales.reduce((s, d) => s + d.gst, 0)],
        ],
      },
    ],
    filename
  )
}

/**
 * Export inventory report to Excel
 */
export function exportInventoryReport(
  items: Array<{
    name: string
    sku: string
    category: string
    stock: number
    reorderLevel: number
    sellingPrice: number
  }>,
  filename = 'inventory-report'
) {
  exportToExcel(
    [
      {
        name: 'Stock',
        headers: ['Product', 'Product Code', 'Category', 'Current Stock', 'Min Stock', 'Selling Price (₹)'],
        rows: items.map((i) => [i.name, i.sku, i.category, i.stock, i.reorderLevel, i.sellingPrice]),
      },
    ],
    filename
  )
}

/**
 * Export outstanding payments report to Excel
 */
export function exportOutstandingReport(
  customers: Array<{
    firstName: string
    lastName?: string
    phone: string
    totalPurchases: number
    totalDue: number
  }>,
  filename = 'outstanding-report'
) {
  exportToExcel(
    [
      {
        name: 'Amounts Due',
        headers: ['Customer', 'Phone', 'Total Purchases (₹)', 'Amount Due (₹)'],
        rows: customers.map((c) => [`${c.firstName} ${c.lastName || ''}`.trim(), c.phone, c.totalPurchases, c.totalDue]),
      },
      {
        name: 'Summary',
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Customers', customers.length],
          ['Total Amount Due', customers.reduce((s, c) => s + c.totalDue, 0)],
        ],
      },
    ],
    filename
  )
}
