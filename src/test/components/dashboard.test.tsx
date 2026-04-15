import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import DashboardPage from '@/app/(dashboard)/dashboard/page'

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((options) => {
    // Return mock data based on query key
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

  it('renders dashboard with stats', async () => {
    render(<DashboardPage />)

    // Check for dashboard heading
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText(/₹15,000/)).toBeInTheDocument()
    })
  })

  it('displays recent sales', async () => {
    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('INV-001')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('shows quick action buttons', () => {
    render(<DashboardPage />)

    expect(screen.getByText('New Sale')).toBeInTheDocument()
  })
})
