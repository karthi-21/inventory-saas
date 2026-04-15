import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/(dashboard)/dashboard/page'

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options: { queryKey: string[] }) => {
    if (options?.queryKey?.[0] === 'dashboard-stats') {
      return {
        data: {
          todaySales: 15000,
          todayInvoices: 25,
          newCustomers: 3,
          lowStockCount: 2,
          pendingPayments: 1,
        },
        isLoading: false,
        error: null,
      }
    }
    if (options?.queryKey?.[0] === 'recent-sales') {
      return {
        data: [
          {
            id: 'inv-1',
            invoiceNumber: 'INV-001',
            customerName: 'John Doe',
            totalAmount: 2500,
            createdAt: new Date().toISOString(),
            itemCount: 3,
          },
        ],
        isLoading: false,
        error: null,
      }
    }
    return { data: null, isLoading: false, error: null }
  }),
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dashboard heading', async () => {
    render(<DashboardPage />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders stats when loaded', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText(/₹15,000/)).toBeInTheDocument()
    })
  })

  it('shows quick action buttons', () => {
    render(<DashboardPage />)

    // "New Sale" appears in multiple places (quick actions + nav cards)
    const newSaleButtons = screen.getAllByText('New Sale')
    expect(newSaleButtons.length).toBeGreaterThan(0)
  })
})