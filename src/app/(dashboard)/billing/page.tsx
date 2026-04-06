'use client'

import { Card, CardContent } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Filter,
  TrendingUp,
  TrendingDown,
  IndianRupee,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const mockInvoices = [
  { id: 'inv1', invoiceNumber: 'INV202600001', invoiceDate: '2026-04-04', customer: 'Walk-in Customer', store: 'Chennai', items: 3, subtotal: 23220, totalGst: 4180, totalAmount: 27400, paymentStatus: 'PAID', billingType: 'UPI' },
  { id: 'inv2', invoiceNumber: 'INV202600002', invoiceDate: '2026-04-04', customer: 'Priya Sharma', store: 'Chennai', items: 1, subtotal: 101695, totalGst: 18305, totalAmount: 120000, paymentStatus: 'PAID', billingType: 'CARD' },
  { id: 'inv3', invoiceNumber: 'INV202600003', invoiceDate: '2026-04-03', customer: 'Quick Mart', store: 'Chennai', items: 12, subtotal: 13636, totalGst: 2455, totalAmount: 16091, paymentStatus: 'PAID', billingType: 'CASH' },
  { id: 'inv4', invoiceNumber: 'INV202600004', invoiceDate: '2026-04-03', customer: 'Anil Reddy', store: 'Coimbatore', items: 5, subtotal: 84746, totalGst: 15254, totalAmount: 100000, paymentStatus: 'PARTIAL', billingType: 'CREDIT' },
  { id: 'inv5', invoiceNumber: 'INV202600005', invoiceDate: '2026-04-02', customer: 'Walk-in Customer', store: 'Chennai', items: 2, subtotal: 763, totalGst: 0, totalAmount: 763, paymentStatus: 'PAID', billingType: 'CASH' },
]

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  const filtered = mockInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inv.paymentStatus === statusFilter
    const matchesDate = !dateFilter || inv.invoiceDate === dateFilter
    return matchesSearch && matchesStatus && matchesDate
  })

  const totalSales = mockInvoices.reduce((a, inv) => a + inv.totalAmount, 0)
  const paidCount = mockInvoices.filter((inv) => inv.paymentStatus === 'PAID').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage invoices and sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
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
              <p className="text-2xl font-bold">₹{(totalSales / 100000).toFixed(2)}L</p>
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
              <p className="text-2xl font-bold">{paidCount} / {mockInvoices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending / Due</p>
              <p className="text-2xl font-bold">
                ₹{mockInvoices.filter((inv) => inv.paymentStatus !== 'PAID').reduce((a, inv) => a + inv.totalAmount, 0).toLocaleString('en-IN')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice or customer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="DUE">Due</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-40"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium font-mono">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.invoiceDate}</TableCell>
                  <TableCell>{inv.customer}</TableCell>
                  <TableCell>{inv.store}</TableCell>
                  <TableCell className="text-right">{inv.items}</TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.paymentStatus === 'PAID'
                          ? 'default'
                          : inv.paymentStatus === 'PARTIAL'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {inv.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{inv.billingType}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
