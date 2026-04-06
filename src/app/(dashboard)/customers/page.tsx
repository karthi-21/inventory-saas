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
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Gift,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const mockCustomers = [
  { id: 'c1', firstName: 'Priya', lastName: 'Sharma', phone: '9876543210', email: 'priya@example.com', customerType: 'RETAIL', loyaltyPoints: 450, totalPurchases: 12, lastPurchase: '2026-04-03', creditBalance: 0 },
  { id: 'c2', firstName: 'Anil', lastName: 'Reddy', phone: '9876543211', email: 'anil@example.com', customerType: 'WHOLESALE', loyaltyPoints: 1200, totalPurchases: 48, lastPurchase: '2026-04-02', creditBalance: 15000 },
  { id: 'c3', firstName: 'Meenakshi', lastName: '', phone: '9876543212', email: '', customerType: 'RETAIL', loyaltyPoints: 80, totalPurchases: 5, lastPurchase: '2026-03-28', creditBalance: 0 },
  { id: 'c4', firstName: 'Quick', lastName: 'Mart', phone: '9876543213', email: 'quickmart@example.com', customerType: 'WHOLESALE', loyaltyPoints: 3200, totalPurchases: 120, lastPurchase: '2026-04-04', creditBalance: 45000 },
  { id: 'c5', firstName: 'Ramesh', lastName: 'Kumar', phone: '9876543214', email: 'ramesh@example.com', customerType: 'RETAIL', loyaltyPoints: 200, totalPurchases: 8, lastPurchase: '2026-03-25', creditBalance: 0 },
]

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const filtered = mockCustomers.filter(
    (c) =>
      c.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage customer relationships and loyalty</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{mockCustomers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Loyalty Points</p>
              <p className="text-2xl font-bold">{mockCustomers.reduce((a, c) => a + c.loyaltyPoints, 0).toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <CreditCard className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outstanding Credit</p>
              <p className="text-2xl font-bold">₹{mockCustomers.reduce((a, c) => a + Number(c.creditBalance), 0).toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
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
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Loyalty Points</TableHead>
                <TableHead className="text-right">Total Purchases</TableHead>
                <TableHead>Last Purchase</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.firstName}{customer.lastName ? ` ${customer.lastName}` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.customerType === 'WHOLESALE' ? 'default' : 'outline'}>
                      {customer.customerType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="gap-1">
                      <Gift className="h-3 w-3" />
                      {customer.loyaltyPoints}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{customer.totalPurchases}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.lastPurchase}</TableCell>
                  <TableCell className={`text-right font-medium ${Number(customer.creditBalance) > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    {Number(customer.creditBalance) > 0 ? `₹${Number(customer.creditBalance).toLocaleString('en-IN')}` : '-'}
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
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input placeholder="Last name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input placeholder="+91 98765 43210" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="email@example.com" type="email" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select defaultValue="RETAIL">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="WHOLESALE">Wholesale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input placeholder="27AABCU9603R1ZM" className="uppercase" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button>Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
