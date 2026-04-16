/**
 * Excel Export Utility
 * Uses xlsx library to export data to .xlsx files with multiple sheets
 */
import * as XLSX from 'xlsx'

export interface ExcelSheet {
  name: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

export function exportToExcel(sheets: ExcelSheet[], filename: string) {
  const wb = XLSX.utils.book_new()

  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows])

    // Set column widths based on header length
    ws['!cols'] = sheet.headers.map((h) => ({
      wch: Math.max(h.length + 2, 12),
    }))

    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  }

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
}

/**
 * Export sales report to Excel
 */
export function exportSalesReport(
  dailySales: Array<{ date: string; invoices: number; revenue: number; paid: number; due: number; gst: number }>,
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
  items: Array<{ name: string; sku: string; category: string; stock: number; reorderLevel: number; sellingPrice: number }>,
  filename = 'inventory-report'
) {
  exportToExcel(
    [
      {
        name: 'Inventory',
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
  customers: Array<{ firstName: string; lastName?: string; phone: string; totalPurchases: number; totalDue: number }>,
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