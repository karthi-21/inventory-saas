import { http, HttpResponse } from 'msw'

// Mock API handlers for testing
export const handlers = [
  // Auth handlers
  http.get('/api/auth/callback-server', () => {
    return HttpResponse.json({ success: true })
  }),

  // Billing handlers
  http.get('/api/billing', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-001',
          customer: { firstName: 'John', lastName: 'Doe' },
          totalAmount: 1500,
          createdAt: new Date().toISOString(),
          items: [{ id: 'item-1', quantity: 2 }],
        },
      ],
    })
  }),

  http.post('/api/billing', async () => {
    return HttpResponse.json({
      id: 'inv-new',
      invoiceNumber: 'INV-002',
      totalAmount: 2500,
    })
  }),

  // Products handlers
  http.get('/api/products', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'prod-1',
          name: 'Test Product',
          sku: 'TEST-001',
          sellingPrice: 500,
          mrp: 600,
          gstRate: 18,
          category: { name: 'Electronics' },
          inventoryStocks: [{ quantity: 100 }],
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false,
      },
    })
  }),

  // Inventory handlers
  http.get('/api/inventory', () => {
    return HttpResponse.json({
      stocks: [
        {
          id: 'stock-1',
          product: { name: 'Test Product', sku: 'TEST-001', reorderLevel: 10 },
          quantity: 5,
          store: { id: 'store-1', name: 'Main Store' },
          location: { id: 'loc-1', name: 'Warehouse' },
        },
      ],
      total: 1,
    })
  }),

  // Reports handlers
  http.get('/api/reports', () => {
    return HttpResponse.json({
      todayTotal: 5000,
      todayCount: 10,
      newCustomers: 3,
      lowStockCount: 2,
      pendingPayments: 1,
    })
  }),

  // Customers handlers
  http.get('/api/customers', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'cust-1',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: '9876543210',
          email: 'jane@example.com',
          creditBalance: 0,
          loyaltyPoints: 100,
        },
      ],
    })
  }),

  // Stores handlers
  http.get('/api/stores', () => {
    return HttpResponse.json({
      data: [
        {
          id: 'store-1',
          name: 'Chennai Showroom',
          code: 'CHN-001',
          storeType: 'ELECTRONICS',
          isActive: true,
        },
      ],
    })
  }),

  // Payment handlers
  http.post('/api/payments/create-order', async () => {
    return HttpResponse.json({
      orderId: 'order_test_123',
      amount: 99900,
      currency: 'INR',
    })
  }),

  http.post('/api/payments/verify-payment', async () => {
    return HttpResponse.json({
      success: true,
      message: 'Payment verified',
    })
  }),
]
