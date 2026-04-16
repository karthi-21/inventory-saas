import { describe, it, expect } from 'vitest'
import { exportToExcel, exportSalesReport, exportInventoryReport, exportOutstandingReport } from '@/lib/export-excel'

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: vi.fn().mockReturnValue({ '!cols': [] }),
    book_new: vi.fn().mockReturnValue({ SheetNames: [] }),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}))

describe('Excel Export', () => {
  describe('exportToExcel', () => {
    it('should call XLSX.writeFile with correct filename', async () => {
      const XLSX = await import('xlsx')
      exportToExcel(
        [{ name: 'Test', headers: ['A', 'B'], rows: [[1, 2]] }],
        'test-report'
      )
      expect(XLSX.writeFile).toHaveBeenCalled()
    })

    it('should add .xlsx extension if missing', async () => {
      const XLSX = await import('xlsx')
      exportToExcel(
        [{ name: 'Test', headers: ['A'], rows: [[1]] }],
        'test'
      )
      expect(XLSX.writeFile).toHaveBeenCalled()
    })

    it('should not double-add .xlsx extension', async () => {
      const XLSX = await import('xlsx')
      exportToExcel(
        [{ name: 'Test', headers: ['A'], rows: [[1]] }],
        'test.xlsx'
      )
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  describe('exportSalesReport', () => {
    it('should create two sheets (Daily Sales + Summary)', async () => {
      const XLSX = await import('xlsx')
      exportSalesReport([
        { date: '2026-04-01', invoices: 5, revenue: 10000, paid: 8000, due: 2000, gst: 1800 },
      ])
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  describe('exportInventoryReport', () => {
    it('should create Inventory sheet', async () => {
      const XLSX = await import('xlsx')
      exportInventoryReport([
        { name: 'USB Cable', sku: 'USB-001', category: 'Accessories', stock: 50, reorderLevel: 10, sellingPrice: 150 },
      ])
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })

  describe('exportOutstandingReport', () => {
    it('should create Amounts Due + Summary sheets', async () => {
      const XLSX = await import('xlsx')
      exportOutstandingReport([
        { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210', totalPurchases: 50000, totalDue: 15000 },
      ])
      expect(XLSX.writeFile).toHaveBeenCalled()
    })
  })
})