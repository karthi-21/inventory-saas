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
  ShoppingCart,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
} from 'lucide-react'
import { useState } from 'react'

const mockVendors = [
  { id: 'v1', name: 'Samsung India Electronics', phone: '9876543001', email: 'orders@samsung.in', gstin: '27AAACH0000P1Z5', city: 'Mumbai', creditPeriodDays: 30, totalPurchased: 2450000 },
  { id: 'v2', name: 'Apple India Pvt Ltd', phone: '9876543002', email: 'b2b@apple.com', gstin: '07AAACH0000P1Z5', city: 'New Delhi', creditPeriodDays: 15, totalPurchased: 5800000 },
  { id: 'v3', name: 'LG Electronics India', phone: '9876543003', email: 'orders@lg.in', gstin: '29AAACH0000P1Z5', city: 'Bangalore', creditPeriodDays: 30, totalPurchased: 1200000 },
  { id: 'v4', name: 'Wholesale Grocers Ltd', phone: '9876543004', email: 'sales@wholesalegrocery.in', gstin: '33AAACH0000P1Z5', city: 'Chennai', creditPeriodDays: 45, totalPurchased: 890000 },
  { id: 'v5', name: 'Sony India', phone: '9876543005', email: 'enterprise@sony.co.in', gstin: '27AAACS0000P1Z5', city: 'Mumbai', creditPeriodDays: 30, totalPurchased: 1800000 },
]

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const filtered = mockVendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.gstin.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">Manage suppliers and purchase orders</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold">{mockVendors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Building className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Purchased</p>
              <p className="text-2xl font-bold">₹{(mockVendors.reduce((a, v) => a + v.totalPurchased, 0) / 100000).toFixed(1)}L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or GSTIN..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Credit Period</TableHead>
                <TableHead className="text-right">Total Purchased</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{vendor.gstin}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {vendor.phone}
                    </div>
                  </TableCell>
                  <TableCell>{vendor.city}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{vendor.creditPeriodDays} days</TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    ₹{(vendor.totalPurchased / 100000).toFixed(1)}L
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input placeholder="Vendor business name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input placeholder="27AABCU9603R1ZM" className="uppercase" />
              </div>
              <div className="space-y-2">
                <Label>PAN</Label>
                <Input placeholder="AABCU9603R" className="uppercase" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="orders@vendor.in" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" />
              </div>
              <div className="space-y-2">
                <Label>Credit Period (days)</Label>
                <Input type="number" placeholder="30" defaultValue="30" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button>Save Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
