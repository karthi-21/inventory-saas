'use client'

import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Receipt,
  Package,
  TrendingUp,
  IndianRupee,
  Users,
  AlertTriangle,
  AlertCircle,
  Award,
} from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { usePOSStore } from '@/stores/pos-store'

interface DashboardStats {
  todaySales: number
  todayInvoices: number
  newCustomers: number
  lowStockCount: number
  pendingPayments: number
}

interface RecentSale {
  id: string
  invoiceNumber: string
  customerName: string
  totalAmount: number
  createdAt: string
  itemCount: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface LowStockItem {
  id: string
  name: string
  sku: string
  quantity: number
  reorderLevel: number
}

export default function DashboardPage() {
  const currentStoreId = usePOSStore((state) => state.currentStoreId)

  // Fetch stores for store name display and validation
  const { data: stores } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['stores'],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      const data = await res.json()
      return data.data || []
    },
  })

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats', currentStoreId],
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams({ type: 'sales-summary' })
      if (currentStoreId) params.set('storeId', currentStoreId)
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      return {
        todaySales: data.todayTotal || 0,
        todayInvoices: data.todayCount || 0,
        newCustomers: data.newCustomers || 0,
        lowStockCount: data.lowStockCount || 0,
        pendingPayments: data.pendingPayments || 0,
      }
    },
  })

  // Fetch recent sales
  const { data: recentSales, isLoading: salesLoading } = useQuery<RecentSale[]>({
    queryKey: ['recent-sales', currentStoreId],
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '5' })
      if (currentStoreId) params.set('storeId', currentStoreId)
      const res = await fetch(`/api/billing?${params}`)
      if (!res.ok) throw new Error('Failed to fetch recent sales')
      const data = await res.json()
      return (data.data || []).map((inv: Record<string, unknown>) => ({
        id: inv.id as string,
        invoiceNumber: inv.invoiceNumber as string,
        customerName: (inv.customer as Record<string, unknown>)?.firstName
          ? `${(inv.customer as Record<string, unknown>).firstName}${(inv.customer as Record<string, unknown>).lastName ? ' ' + (inv.customer as Record<string, unknown>).lastName : ''}`
          : 'Walk-in Customer',
        totalAmount: Number(inv.totalAmount) || 0,
        createdAt: inv.createdAt as string,
        itemCount: ((inv.items as Array<unknown>) || []).length,
      }))
    },
  })

  // Fetch low stock items
  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery<LowStockItem[]>({
    queryKey: ['low-stock-alerts', currentStoreId],
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams({ lowStock: 'true', limit: '5' })
      if (currentStoreId) params.set('storeId', currentStoreId)
      const res = await fetch(`/api/inventory?${params}`)
      if (!res.ok) throw new Error('Failed to fetch low stock')
      const data = await res.json()
      return (data.stocks || []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        name: (item.product as Record<string, unknown>)?.name as string || 'Unknown',
        sku: (item.product as Record<string, unknown>)?.sku as string || '',
        quantity: Number(item.quantity) || 0,
        reorderLevel: Number((item.product as Record<string, unknown>)?.reorderLevel) || 10,
      }))
    },
  })

  // Fetch top products
  const { data: topProducts, isLoading: topLoading } = useQuery<TopProduct[]>({
    queryKey: ['top-products'],
    queryFn: async () => {
      const res = await fetch('/api/reports?type=sales-by-product&limit=5')
      if (!res.ok) throw new Error('Failed to fetch top products')
      const data = await res.json()
      return (data.products || []).map((p: Record<string, unknown>) => ({
        name: (p.productName || p.name || 'Unknown') as string,
        quantity: Number(p.quantity || p.totalQty) || 0,
        revenue: Number(p.revenue || p.totalRevenue) || 0,
      }))
    },
  })

  // Fetch loyalty dashboard data
  const { data: loyaltyData } = useQuery<{
    loyaltyEnabled: boolean
    totalActivePoints: number
    pointsEarnedThisMonth: number
    pointsRedeemedThisMonth: number
    topCustomers: Array<{ id: string; name: string; phone: string; points: number; value: number }>
  } | null>({
    queryKey: ['loyalty-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/loyalty/dashboard')
      if (!res.ok) return null
      return res.json()
    },
  })

  const stats = [
    {
      title: "Today's Sales",
      value: statsData ? `₹${statsData.todaySales.toLocaleString('en-IN')}` : '₹0',
      change: '+12.5%',
      changeType: 'up' as const,
      icon: IndianRupee,
      loading: statsLoading,
    },
    {
      title: 'Bills',
      value: statsData?.todayInvoices?.toString() || '0',
      change: '+8',
      changeType: 'up' as const,
      icon: Receipt,
      loading: statsLoading,
    },
    {
      title: 'New Customers',
      value: statsData?.newCustomers?.toString() || '0',
      change: '+3',
      changeType: 'up' as const,
      icon: Users,
      loading: statsLoading,
    },
    {
      title: 'Low Stock Items',
      value: statsData?.lowStockCount?.toString() || '0',
      change: '-2',
      changeType: 'down' as const,
      icon: AlertTriangle,
      loading: statsLoading,
    },
  ]

  // Client-side only date to avoid hydration mismatch
  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    const today = new Date()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDateStr(today.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }))
  }, [])

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">Failed to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {dateStr} • {currentStoreId ? stores?.find(s => s.id === currentStoreId)?.name || 'Your Store' : stores?.[0]?.name || 'Your Store'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/billing/new">
            <Button>
              <Receipt className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div className="space-y-2">
          <Link href="/dashboard/inventory?tab=low">
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-3 p-3">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">{lowStockItems.length} items running low on stock</span>
              </CardContent>
            </Card>
          </Link>
          {statsData && statsData.pendingPayments > 0 && (
            <Link href="/dashboard/billing?status=pending">
              <Card className="border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-3 p-3">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{statsData.pendingPayments} bills awaiting payment</span>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {stat.changeType === 'up' ? (
                    <ArrowUpRight className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-600" />
                  )}
                  <span className={stat.changeType === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span>{' '}
                  vs yesterday
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Sales</CardTitle>
              <Badge>Today</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentSales && recentSales.length > 0 ? (
              <div className="space-y-4">
                {recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/dashboard/billing?id=${sale.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Receipt className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customerName} • {sale.itemCount} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{sale.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No sales today</p>
                <p className="text-sm text-muted-foreground mb-4">Start your first sale</p>
                <Link href="/dashboard/billing/new">
                  <Button size="sm">
                    <Receipt className="h-4 w-4 mr-2" />
                    New Sale
                  </Button>
                </Link>
              </div>
            )}
            {recentSales && recentSales.length > 0 && (
              <div className="mt-4">
                <Link href="/dashboard/billing" className="text-sm text-primary hover:underline">
                  View all bills →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Selling</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : topProducts && topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} sold</p>
                    </div>
                    <p className="text-sm font-medium text-green-600">₹{item.revenue.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Widget */}
      {loyaltyData?.loyaltyEnabled && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Loyalty Program
              </CardTitle>
              <Link href="/dashboard/customers">
                <Button variant="outline" size="sm">View Customers</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{loyaltyData.totalActivePoints?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-muted-foreground">Active Points</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-2xl font-bold text-green-600">{loyaltyData.pointsEarnedThisMonth?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-muted-foreground">Earned This Month</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-2xl font-bold text-blue-600">{loyaltyData.pointsRedeemedThisMonth?.toLocaleString() ?? 0}</p>
                <p className="text-xs text-muted-foreground">Redeemed This Month</p>
              </div>
            </div>
            {loyaltyData.topCustomers && loyaltyData.topCustomers.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Top Loyal Customers</p>
                {loyaltyData.topCustomers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-2">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{c.points} pts</p>
                      <p className="text-xs text-green-600">₹{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {lowStockLoading ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </CardTitle>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="text-right space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : lowStockItems && lowStockItems.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Low Stock Alerts
              </CardTitle>
              <Link href="/dashboard/inventory?tab=low">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">{item.quantity} left</p>
                    <p className="text-xs text-muted-foreground">Min: {item.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/billing/new"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">New Sale</p>
            <p className="text-sm text-muted-foreground">Start billing</p>
          </div>
        </Link>
        <Link
          href="/dashboard/inventory"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Add Stock</p>
            <p className="text-sm text-muted-foreground">Purchase entry</p>
          </div>
        </Link>
        <Link
          href="/dashboard/customers"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Add Customer</p>
            <p className="text-sm text-muted-foreground">New registration</p>
          </div>
        </Link>
        <Link
          href="/dashboard/reports"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Reports</p>
            <p className="text-sm text-muted-foreground">Sales Reports</p>
          </div>
        </Link>
      </div>
    </div>
  )
}