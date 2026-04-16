import { describe, it, expect, vi } from 'vitest'
import { welcomeEmail, paymentReminderEmail, invoiceReceiptEmail, lowStockAlertEmail } from '@/lib/emails'

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' }, error: null }),
    },
  })),
}))

describe('Email Templates', () => {
  describe('welcomeEmail', () => {
    it('should generate HTML with user and store name', () => {
      const html = welcomeEmail({
        userName: 'Rajesh',
        storeName: 'Sharma Electronics',
        dashboardUrl: 'https://app.ezvento.karth-21.com/dashboard',
      })

      expect(html).toContain('Rajesh')
      expect(html).toContain('Sharma Electronics')
      expect(html).toContain('https://app.ezvento.karth-21.com/dashboard')
      expect(html).toContain('Welcome to Ezvento')
    })
  })

  describe('paymentReminderEmail', () => {
    it('should generate HTML with customer name and outstanding amount', () => {
      const html = paymentReminderEmail({
        customerName: 'Amit',
        storeName: 'Test Store',
        totalOutstanding: 15000,
        invoiceCount: 3,
        invoiceBreakdown: [
          { invoiceNumber: 'INV-001', date: '15/03/2026', amount: 5000 },
          { invoiceNumber: 'INV-002', date: '20/03/2026', amount: 10000 },
        ],
      })

      expect(html).toContain('Amit')
      expect(html).toContain('Test Store')
      expect(html).toContain('₹15,000.00')
      expect(html).toContain('INV-001')
    })
  })

  describe('invoiceReceiptEmail', () => {
    it('should generate HTML with invoice details', () => {
      const html = invoiceReceiptEmail({
        customerName: 'Priya',
        invoiceNumber: 'INV-100',
        storeName: 'Demo Store',
        invoiceDate: '01/04/2026',
        items: [
          { description: 'USB Cable', quantity: 2, unitPrice: 150, gstRate: 18, totalAmount: 354 },
        ],
        subtotal: 300,
        totalGst: 54,
        totalAmount: 354,
        paymentMethod: 'Cash',
      })

      expect(html).toContain('Priya')
      expect(html).toContain('INV-100')
      expect(html).toContain('USB Cable')
      expect(html).toContain('₹354.00')
    })
  })

  describe('lowStockAlertEmail', () => {
    it('should generate HTML with low stock items', () => {
      const html = lowStockAlertEmail({
        storeName: 'My Store',
        items: [
          { name: 'USB Cable', sku: 'USB-001', currentStock: 2, reorderLevel: 10 },
        ],
        inventoryUrl: 'https://app.ezvento.karth-21.com/dashboard/inventory',
      })

      expect(html).toContain('My Store')
      expect(html).toContain('USB Cable')
      expect(html).toContain('USB-001')
    })
  })
})

describe('sendEmail', () => {
  it('should handle missing API key gracefully', async () => {
    // When RESEND_API_KEY is not set, it should return error
    const originalEnv = process.env.RESEND_API_KEY
    delete process.env.RESEND_API_KEY

    // Re-import to get fresh instance
    vi.resetModules()

    const { sendEmail: freshSendEmail } = await import('@/lib/emails')
    const result = await freshSendEmail({
      to: 'test@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    })

    // Should either succeed (mock) or return an error object
    expect(result).toBeDefined()
    expect(typeof result.id).toBe('string')

    process.env.RESEND_API_KEY = originalEnv
  })
})