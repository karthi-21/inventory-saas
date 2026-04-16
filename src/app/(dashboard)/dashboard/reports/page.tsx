'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  Users,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'

interface Store {
  id: string
  name: string
}

interface DailySales {
  date: string
  invoices: number
  revenue: number
  paid: number
  due: number
  gst: number
}

interface GstSummary {
  hsnCode: string
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalGst: number
  totalAmount: number
  quantity: number
}

interface StockReport {
  productId: string
  productName: string
  sku: string
  variant?: string
  store: string
  location?: string
  quantity: number
  reorderLevel: number
  isLowStock: boolean
}

const reportTypes = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp, description: 'Daily, weekly, monthly sales' },
  { id: 'gst', label: 'GST Summary', icon: FileText, description: 'HSN-wise GST breakdown' },
  { id: 'inventory', label: 'Inventory', icon: Package, description: 'Current stock levels' },
  { id: 'outstanding', label: 'Amounts Due', icon: Users, description: 'Customer credit balance' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [storeFilter, setStoreFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7days')
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')

  // Fetch stores for filter
  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      const json = await res.json()
      return json.data || []
    },
  })

  // Calculate date range
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let from: Date
    let to: Date = today

    switch (dateRange) {
      case 'today':
        from = today
        break
      case '7days':
        from = new Date(today)
        from.setDate(from.getDate() - 7)
        break
      case '30days':
        from = new Date(today)
        from.setDate(from.getDate() - 30)
        break
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        to = new Date(today.getFullYear(), today.getMonth(), 0)
        break
      case 'custom':
        from = customFromDate ? new Date(customFromDate) : new Date(today)
        to = customToDate ? new Date(customToDate) : today
        break
      default:
        from = new Date(today)
        from.setDate(from.getDate() - 7)
    }

    return { from: from.toISOString(), to: to.toISOString() }
  }

  const dateRangeParams = dateRange === 'custom' && customFromDate && customToDate
    ? `&from=${customFromDate}&to=${customToDate}`
    : ''

  // Fetch sales report
  const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery<{
    dailySales: DailySales[]
    totals: { revenue: number; paid: number; due: number; gst: number }
  }>({
    queryKey: ['reports', 'sales', storeFilter, dateRange, customFromDate, customToDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('type', 'daily-sales')
      if (storeFilter !== 'all') params.set('storeId', storeFilter)
      const { from, to } = getDateRange()
      params.set('from', from)
      params.set('to', to)
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch sales report')
      return res.json()
    },
    enabled: reportType === 'sales',
  })

  // Fetch GST report
  const { data: gstData, isLoading: gstLoading } = useQuery<{
    summary: GstSummary[]
    totals: { taxableAmount: number; cgst: number; sgst: number; igst: number; totalGst: number; totalAmount: number }
  }>({
    queryKey: ['reports', 'gst', storeFilter, dateRange, customFromDate, customToDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('type', 'gst-summary')
      if (storeFilter !== 'all') params.set('storeId', storeFilter)
      const { from, to } = getDateRange()
      params.set('from', from)
      params.set('to', to)
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch GST report')
      return res.json()
    },
    enabled: reportType === 'gst',
  })

  // Fetch inventory report
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery<{
    totalProducts: number
    stockValue: number
    lowStockCount: number
    outOfStockCount: number
    stocks: StockReport[]
  }>({
    queryKey: ['reports', 'inventory', storeFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('type', 'stock-report')
      if (storeFilter !== 'all') params.set('storeId', storeFilter)
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error('Failed to fetch inventory report')
      return res.json()
    },
    enabled: reportType === 'inventory',
  })

  // Fetch outstanding report
  const { data: outstandingData, isLoading: outstandingLoading } = useQuery<{
    customers: Array<{
      id: string
      firstName: string
      lastName?: string
      phone: string
      totalDue: number
      totalPurchases: number
    }>
    totalOutstanding: number
  }>({
    queryKey: ['reports', 'outstanding'],
    queryFn: async () => {
      const res = await fetch('/api/reports?type=customer-outstanding')
      if (!res.ok) throw new Error('Failed to fetch outstanding report')
      return res.json()
    },
    enabled: reportType === 'outstanding',
  })

  const handleExport = (format: 'csv' | 'excel') => {
    if (format === 'excel') {
      toast.info('Excel export coming soon!')
      return
    }

    const timestamp = new Date().toISOString().split('T')[0]
    let csvData: Record<string, unknown>[] = []
    let filename = `report-${timestamp}.csv`

    switch (reportType) {
      case 'sales':
        if (!salesData?.dailySales?.length) {
          toast.error('No sales data to export')
          return
        }
        csvData = salesData.dailySales.map((row) => ({
          Date: row.date,
          Bills: row.invoices,
          Revenue: row.revenue,
          GST: row.gst,
          Paid: row.paid,
          Due: row.due,
        }))
        filename = `sales-report-${timestamp}.csv`
        break

      case 'gst':
        if (!gstData?.summary?.length) {
          toast.error('No GST data to export')
          return
        }
        csvData = gstData.summary.map((row) => ({
          HSNCode: row.hsnCode,
          TaxableAmount: row.taxableAmount,
          CGST: Math.round(row.cgst),
          SGST: Math.round(row.sgst),
          IGST: row.igst,
          TotalGST: Math.round(row.totalGst),
          TotalAmount: row.totalAmount,
          Quantity: row.quantity,
        }))
        filename = `gst-report-${timestamp}.csv`
        break

      case 'inventory':
        if (!inventoryData?.stocks?.length) {
          toast.error('No inventory data to export')
          return
        }
        csvData = inventoryData.stocks.map((stock) => ({
          Product: stock.productName,
          Code: stock.sku,
          Variant: stock.variant || '',
          Store: stock.store,
          Location: stock.location || '',
          Quantity: stock.quantity,
          ReorderLevel: stock.reorderLevel,
          Status: stock.quantity === 0 ? 'Out of Stock' : stock.isLowStock ? 'Low Stock' : 'In Stock',
        }))
        filename = `inventory-report-${timestamp}.csv`
        break

      case 'outstanding':
        if (!outstandingData?.customers?.length) {
          toast.error('No outstanding data to export')
          return
        }
        csvData = outstandingData.customers.map((c) => ({
          FirstName: c.firstName,
          LastName: c.lastName || '',
          Phone: c.phone,
          TotalPurchases: c.totalPurchases,
          AmountDue: c.totalDue,
        }))
        filename = `outstanding-report-${timestamp}.csv`
        break
    }

    exportToCSV(csvData, filename)
    toast.success('Exported successfully')
  }

  const isLoading = salesLoading || gstLoading || inventoryLoading || outstandingLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">View and download your business reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-1">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')} className="gap-1">
            <Download className="h-3.5 w-3.5" />
            Excel
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              reportType === type.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => setReportType(type.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                reportType === type.id ? 'bg-primary text-white' : 'bg-muted'
              }`}>
                <type.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{type.label}</p>
                <p className="text-xs text-muted-foreground">{type.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Store</Label>
            <Select value={storeFilter} onValueChange={(v) => v && setStoreFilter(v)}>
              <SelectTrigger className="w-48">
                {storeFilter === 'all' ? 'All Stores' : (stores || []).find(s => s.id === storeFilter)?.name ?? 'All Stores'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date Range</Label>
            <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
              <SelectTrigger className="w-40">
                {dateRange === 'today' ? 'Today'
                  : dateRange === '7days' ? 'Last 7 Days'
                  : dateRange === '30days' ? 'Last 30 Days'
                  : dateRange === 'thisMonth' ? 'This Month'
                  : dateRange === 'lastMonth' ? 'Last Month'
                  : dateRange === 'custom' ? 'Custom Range'
                  : 'Last 7 Days'}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateRange === 'custom' && (
            <>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-36"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-36"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sales Report */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : salesError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <p className="text-muted-foreground">Failed to load sales data</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : salesData ? (
            <>
              {/* Summary */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <IndianRupee className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-xl font-bold">₹{(salesData.totals?.revenue || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <Receipt className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bills</p>
                      <p className="text-xl font-bold">{salesData.dailySales?.reduce((sum, d) => sum + d.invoices, 0) || 0}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GST Collected</p>
                      <p className="text-xl font-bold">₹{(salesData.totals?.gst || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Order Value</p>
                      <p className="text-xl font-bold">
                        ₹{salesData.dailySales?.length > 0
                          ? Math.round(salesData.totals.revenue / salesData.dailySales.reduce((sum, d) => sum + d.invoices, 0)).toLocaleString('en-IN')
                          : '0'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Sales</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {salesData.dailySales?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No sales data for this period</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Bills</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">GST</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesData.dailySales?.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell className="font-medium">
                              {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </TableCell>
                            <TableCell className="text-right">{row.invoices}</TableCell>
                            <TableCell className="text-right font-medium">₹{row.revenue.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right text-muted-foreground">₹{row.gst.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right text-green-600">₹{row.paid.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right text-orange-600">₹{row.due.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* GST Report */}
      {reportType === 'gst' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : gstData ? (
            <>
              {/* GST Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <IndianRupee className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taxable Amount</p>
                      <p className="text-xl font-bold">₹{(gstData.totals?.taxableAmount || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total GST</p>
                      <p className="text-xl font-bold">₹{(gstData.totals?.totalGst || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CGST + SGST</p>
                      <p className="text-xl font-bold">₹{((gstData.totals?.cgst || 0) + (gstData.totals?.sgst || 0)).toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* HSN-wise Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">HSN-wise GST Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {gstData.summary?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No GST data for this period</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>HSN Code</TableHead>
                          <TableHead className="text-right">Taxable Amount</TableHead>
                          <TableHead className="text-right">CGST</TableHead>
                          <TableHead className="text-right">SGST</TableHead>
                          <TableHead className="text-right">Total GST</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gstData.summary?.map((row) => (
                          <TableRow key={row.hsnCode}>
                            <TableCell className="font-mono text-sm">{row.hsnCode}</TableCell>
                            <TableCell className="text-right font-medium">₹{row.taxableAmount.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right text-muted-foreground">₹{Math.round(row.cgst).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right text-muted-foreground">₹{Math.round(row.sgst).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right font-medium">₹{Math.round(row.totalGst).toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right">{row.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : inventoryData ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-xl font-bold">{inventoryData.totalProducts}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <IndianRupee className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Value</p>
                      <p className="text-xl font-bold">₹{(inventoryData.stockValue / 100000).toFixed(1)}L</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                      <TrendingDown className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock</p>
                      <p className="text-xl font-bold text-yellow-600">{inventoryData.lowStockCount}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Out of Stock</p>
                      <p className="text-xl font-bold text-red-600">{inventoryData.outOfStockCount}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stock Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stock Levels</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Reorder</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.stocks?.slice(0, 50).map((stock) => (
                        <TableRow key={`${stock.productId}-${stock.store}`} className={stock.quantity === 0 ? 'bg-red-50 dark:bg-red-950/20' : stock.isLowStock ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                          <TableCell className="font-medium">{stock.productName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{stock.sku}</TableCell>
                          <TableCell>{stock.store}</TableCell>
                          <TableCell className="text-right font-medium">{stock.quantity}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{stock.reorderLevel}</TableCell>
                          <TableCell>
                            {stock.quantity === 0 ? (
                              <Badge variant="destructive">Out</Badge>
                            ) : stock.isLowStock ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">Low</Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-500 text-green-600">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}

      {/* Outstanding Report */}
      {reportType === 'outstanding' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : outstandingData ? (
            <>
              {/* Summary Card */}
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount Due</p>
                    <p className="text-2xl font-bold text-orange-600">₹{(outstandingData.totalOutstanding || 0).toLocaleString('en-IN')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customers with Amount Due</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {outstandingData.customers?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No customers with amounts due</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="text-right">Total Purchases</TableHead>
                          <TableHead className="text-right">Amount Due</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingData.customers?.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell className="font-medium">
                              {customer.firstName}{customer.lastName ? ` ${customer.lastName}` : ''}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-mono text-sm">{customer.phone}</TableCell>
                            <TableCell className="text-right">₹{customer.totalPurchases.toLocaleString('en-IN')}</TableCell>
                            <TableCell className="text-right font-medium text-orange-600">₹{customer.totalDue.toLocaleString('en-IN')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}