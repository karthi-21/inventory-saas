'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  SelectValue,
} from '@/components/ui/select'
import {
  Receipt,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { usePOSStore } from '@/stores/pos-store'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToCSV } from '@/lib/export'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  customer: { firstName: string; lastName?: string } | null
  store: { name: string }
  totalAmount: number
  amountPaid: number
  amountDue: number
  paymentStatus: string
  billingType: string
  items: Array<{ id: string }>
  createdAt: string
}

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const currentStoreId = usePOSStore((state) => state.currentStoreId)

  // Fetch invoices
  const { data: invoicesData, isLoading, error } = useQuery<{ data: Invoice[]; pagination: { total: number } }>({
    queryKey: ['invoices', searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/billing?${params}`)
      if (!res.ok) throw new Error('Failed to fetch invoices')
      return res.json()
    },
  })

  const invoices = invoicesData?.data || []
  const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const paidCount = invoices.filter((inv) => inv.paymentStatus === 'PAID').length
  const pendingAmount = invoices.filter((inv) => inv.paymentStatus !== 'PAID').reduce((sum, inv) => sum + Number(inv.amountDue), 0)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">Failed to load invoices</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage invoices and sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            if (invoices.length === 0) {
              toast.error('No invoices to export')
              return
            }
            const csvData = invoices.map((inv) => ({
              InvoiceNumber: inv.invoiceNumber,
              Customer: inv.customer
                ? `${inv.customer.firstName}${inv.customer.lastName ? ' ' + inv.customer.lastName : ''}`
                : 'Walk-in Customer',
              Date: new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
              Store: inv.store?.name || '',
              TotalAmount: Number(inv.totalAmount),
              AmountPaid: Number(inv.amountPaid),
              AmountDue: Number(inv.amountDue),
              Status: inv.paymentStatus,
              BillingType: inv.billingType,
            }))
            exportToCSV(csvData, `invoices-${new Date().toISOString().split('T')[0]}.csv`)
            toast.success('Exported successfully')
          }}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/dashboard/billing/new">
            <Button className="gap-2">
              <Receipt className="h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">₹{(totalSales / 100000).toFixed(2)}L</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid Invoices</p>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{paidCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">₹{(pendingAmount / 1000).toFixed(1)}K</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice or customer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="DUE">Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No invoices yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first sale to see invoices here</p>
              <Link href="/dashboard/billing/new">
                <Button>
                  <Receipt className="h-4 w-4 mr-2" />
                  New Sale
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">
                      {invoice.customer
                        ? `${invoice.customer.firstName}${invoice.customer.lastName ? ' ' + invoice.customer.lastName : ''}`
                        : 'Walk-in Customer'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{invoice.store?.name || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.paymentStatus === 'PAID' ? 'default' : invoice.paymentStatus === 'DUE' ? 'destructive' : 'outline'}>
                        {invoice.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}