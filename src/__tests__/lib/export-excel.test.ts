import { describe, it, expect, vi, beforeEach } from 'vitest'
import { exportToExcel, exportSalesReport, exportInventoryReport, exportOutstandingReport } from '@/lib/export-excel'

const mockAddRow = vi.fn()
const mockAddWorksheet = vi.fn().mockReturnValue({ addRow: mockAddRow, getColumn: vi.fn().mockReturnValue({ width: 0 }) })
const mockWriteBuffer = vi.fn().mockResolvedValue(Buffer.from('mock-excel'))

vi.mock('exceljs', () => ({
  default: {
    Workbook: class Workbook {
      addWorksheet = mockAddWorksheet
      xlsx = { writeBuffer: mockWriteBuffer }
    },
  },
}))

// Mock browser APIs
Object.assign(globalThis, {
  URL: {
    createObjectURL: vi.fn().mockReturnValue('blob:mock'),
    revokeObjectURL: vi.fn(),
  },
  document: {
    createElement: vi.fn().mockReturnValue({ click: vi.fn() }),
  },
})

describe('Excel Export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exportToExcel', () => {
    it('should create workbook and add sheets', async () => {
      await exportToExcel(
        [{ name: 'Test', headers: ['A', 'B'], rows: [[1, 2]] }],
        'test-report'
      )
      expect(mockAddWorksheet).toHaveBeenCalledWith('Test')
      expect(mockAddRow).toHaveBeenCalledTimes(2) // header + 1 data row
    })

    it('should add .xlsx extension if missing', async () => {
      const link = document.createElement('a')
      await exportToExcel([{ name: 'Test', headers: ['A'], rows: [[1]] }], 'test')
      expect(link.download).toBe('test.xlsx')
    })

    it('should not double-add .xlsx extension', async () => {
      const link = document.createElement('a')
      await exportToExcel([{ name: 'Test', headers: ['A'], rows: [[1]] }], 'test.xlsx')
      expect(link.download).toBe('test.xlsx')
    })
  })

  describe('exportSalesReport', () => {
    it('should create two sheets (Daily Sales + Summary)', async () => {
      await exportSalesReport([
        { date: '2026-04-01', invoices: 5, revenue: 10000, paid: 8000, due: 2000, gst: 1800 },
      ])
      expect(mockAddWorksheet).toHaveBeenCalledTimes(2)
    })
  })

  describe('exportInventoryReport', () => {
    it('should create Inventory sheet', async () => {
      await exportInventoryReport([
        { name: 'USB Cable', sku: 'USB-001', category: 'Accessories', stock: 50, reorderLevel: 10, sellingPrice: 150 },
      ])
      expect(mockAddWorksheet).toHaveBeenCalledTimes(1)
    })
  })

  describe('exportOutstandingReport', () => {
    it('should create Amounts Due + Summary sheets', async () => {
      await exportOutstandingReport([
        { firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210', totalPurchases: 50000, totalDue: 15000 },
      ])
      expect(mockAddWorksheet).toHaveBeenCalledTimes(2)
    })
  })
})
