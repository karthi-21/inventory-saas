'use client'

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
  SelectValue,
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
} from 'lucide-react'
import { useState } from 'react'

const reportTypes = [
  { id: 'sales', label: 'Sales Report', icon: TrendingUp, description: 'Daily, weekly, monthly sales by store' },
  { id: 'gst', label: 'GST Summary', icon: FileText, description: 'HSN-wise GST breakdown for filing' },
  { id: 'inventory', label: 'Inventory Report', icon: Package, description: 'Current stock levels across locations' },
  { id: 'stock-movement', label: 'Stock Movement', icon: ShoppingCart, description: 'In/out/adjustment history' },
]

const mockSalesData = [
  { date: '2026-04-04', invoices: 38, sales: 45230, gst: 6800, customers: 12 },
  { date: '2026-04-03', invoices: 42, sales: 67890, gst: 10200, customers: 18 },
  { date: '2026-04-02', invoices: 35, sales: 38900, gst: 5800, customers: 10 },
  { date: '2026-04-01', invoices: 40, sales: 52100, gst: 7800, customers: 15 },
  { date: '2026-03-31', invoices: 45, sales: 71200, gst: 10700, customers: 20 },
]

const mockGstData = [
  { hsn: '8415', description: 'Air Conditioning Machines', taxableAmount: 120000, cgst: 10800, sgst: 10800, igst: 0, qty: 8 },
  { hsn: '8528', description: 'TV Monitors', taxableAmount: 80000, cgst: 7200, sgst: 7200, igst: 0, qty: 12 },
  { hsn: '8517', description: 'Telephones', taxableAmount: 240000, cgst: 21600, sgst: 21600, igst: 0, qty: 20 },
  { hsn: 'N/A', description: 'Exempt Items', taxableAmount: 5000, cgst: 0, sgst: 0, igst: 0, qty: 50 },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [storeFilter, setStoreFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7days')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Business intelligence and exportable reports</p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="chennai">Chennai Showroom</SelectItem>
                <SelectItem value="coimbatore">Coimbatore Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Date Range</Label>
            <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
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
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <IndianRupee className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold">₹2,75,320</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invoices</p>
                  <p className="text-xl font-bold">200</p>
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
                  <p className="text-xl font-bold">₹41,300</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order</p>
                  <p className="text-xl font-bold">₹1,376</p>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Sales (₹)</TableHead>
                    <TableHead className="text-right">GST (₹)</TableHead>
                    <TableHead className="text-right">Customers</TableHead>
                    <TableHead className="text-right">Avg Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSalesData.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{row.invoices}</TableCell>
                      <TableCell className="text-right font-medium">₹{row.sales.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-muted-foreground">₹{row.gst.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">{row.customers}</TableCell>
                      <TableCell className="text-right">₹{Math.round(row.sales / row.invoices).toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'gst' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HSN-wise GST Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Taxable Amount</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead className="text-right">Total GST</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockGstData.map((row) => (
                  <TableRow key={row.hsn}>
                    <TableCell className="font-mono text-sm">{row.hsn}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell className="text-right font-medium">₹{row.taxableAmount.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-muted-foreground">₹{row.cgst.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right text-muted-foreground">₹{row.sgst.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right font-medium">₹{(row.cgst + row.sgst).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">{row.qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
