'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  DialogDescription,
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
  Loader2,
  Pencil,
  Trash2,
  IndianRupee,
} from 'lucide-react'
import { toast } from 'sonner'

interface Vendor {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  gstin?: string | null
  pan?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  bankName?: string | null
  bankAccount?: string | null
  bankIfsc?: string | null
  creditPeriodDays: number
  isActive: boolean
  createdAt: string
  _count?: { purchaseInvoices: number }
  totalPurchases: number
  outstandingAmount: number
}

interface VendorResponse {
  data: Vendor[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Other'
]

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    creditPeriodDays: '30',
  })

  // Fetch vendors
  const { data: vendorsData, isLoading, error } = useQuery<VendorResponse>({
    queryKey: ['vendors', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/vendors?${params}`)
      if (!res.ok) throw new Error('Failed to fetch vendors')
      return res.json()
    },
  })

  // Create vendor mutation
  const createVendor = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          creditPeriodDays: Number(data.creditPeriodDays) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create vendor')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor created successfully')
      setShowAddDialog(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create vendor')
    },
  })

  // Update vendor mutation
  const updateVendor = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Vendor> }) => {
      const res = await fetch(`/api/vendors/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update vendor')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor updated successfully')
      setShowEditDialog(false)
      setSelectedVendor(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update vendor')
    },
  })

  // Delete vendor mutation
  const deleteVendor = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete vendor')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor deleted')
      setShowDeleteDialog(false)
      setVendorToDelete(null)
    },
    onError: () => {
      toast.error('Failed to delete vendor')
    },
  })

  const resetForm = () => {
    setForm({
      name: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      bankName: '',
      bankAccount: '',
      bankIfsc: '',
      creditPeriodDays: '30',
    })
  }

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error('Business name is required')
      return
    }
    createVendor.mutate(form)
  }

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setForm({
      name: vendor.name,
      phone: vendor.phone || '',
      email: vendor.email || '',
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      pincode: vendor.pincode || '',
      bankName: vendor.bankName || '',
      bankAccount: vendor.bankAccount || '',
      bankIfsc: vendor.bankIfsc || '',
      creditPeriodDays: String(vendor.creditPeriodDays),
    })
    setShowEditDialog(true)
  }

  const handleUpdate = () => {
    if (!selectedVendor) return
    updateVendor.mutate({
      id: selectedVendor.id,
      updates: {
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        gstin: form.gstin || null,
        pan: form.pan || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        bankName: form.bankName || null,
        bankAccount: form.bankAccount || null,
        bankIfsc: form.bankIfsc || null,
        creditPeriodDays: Number(form.creditPeriodDays) || 0,
      },
    })
  }

  const vendors = vendorsData?.data || []
  const totalPurchased = vendors.reduce((sum, v) => sum + v.totalPurchases, 0)
  const totalOutstanding = vendors.reduce((sum, v) => sum + v.outstandingAmount, 0)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">Failed to load vendors</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['vendors'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">Manage suppliers and purchase orders</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true) }} className="gap-2">
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
              <p className="text-2xl font-bold">{vendorsData?.pagination.total || 0}</p>
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
              <p className="text-2xl font-bold">₹{(totalPurchased / 100000).toFixed(1)}L</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <IndianRupee className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Due</p>
              <p className="text-2xl font-bold">₹{(totalOutstanding / 100000).toFixed(1)}L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or GST Number..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No vendors yet</p>
              <p className="text-sm text-muted-foreground mb-4">Add your first supplier to get started</p>
              <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Add Vendor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>GST Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Payment Due (days)</TableHead>
                  <TableHead className="text-right">Total Purchased</TableHead>
                  <TableHead className="text-right">Amount Due</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {vendor.gstin || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </div>
                        )}
                        {!vendor.phone && !vendor.email && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vendor.city && <span>{vendor.city}</span>}
                        {vendor.city && vendor.state && <span>, </span>}
                        {vendor.state && <span className="text-muted-foreground">{vendor.state}</span>}
                        {!vendor.city && !vendor.state && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {vendor.creditPeriodDays} days
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ₹{(vendor.totalPurchases / 100000).toFixed(1)}L
                    </TableCell>
                    <TableCell className={`text-right font-medium ${vendor.outstandingAmount > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                      {vendor.outstandingAmount > 0 ? `₹${(vendor.outstandingAmount / 1000).toFixed(0)}K` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(vendor)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setVendorToDelete(vendor.id)
                          setShowDeleteDialog(true)
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Vendor</DialogTitle>
            <DialogDescription>Add a new supplier to your vendor list</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input placeholder="Vendor business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GST Number (GSTIN)</Label>
                <Input placeholder="27AABCU9603R1ZM" className="uppercase" maxLength={15} value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>PAN (Tax ID)</Label>
                <Input placeholder="AABCU9603R" className="uppercase" maxLength={10} value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="orders@vendor.in" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state || ''} onValueChange={(v) => setForm({ ...form, state: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {indianStates.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PIN Code</Label>
                <Input placeholder="600001" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Payment Due in X Days</Label>
                <Input type="number" placeholder="30" value={form.creditPeriodDays} onChange={(e) => setForm({ ...form, creditPeriodDays: e.target.value })} />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Bank Details (Optional)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input placeholder="Account number" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input placeholder="IFSC" className="uppercase" value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createVendor.isPending}>
              {createVendor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update vendor information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input placeholder="Vendor business name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>GST Number (GSTIN)</Label>
                <Input placeholder="27AABCU9603R1ZM" className="uppercase" maxLength={15} value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-2">
                <Label>PAN (Tax ID)</Label>
                <Input placeholder="AABCU9603R" className="uppercase" maxLength={10} value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="orders@vendor.in" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={form.state || ''} onValueChange={(v) => setForm({ ...form, state: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {indianStates.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PIN Code</Label>
                <Input placeholder="600001" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Payment Due in X Days</Label>
                <Input type="number" placeholder="30" value={form.creditPeriodDays} onChange={(e) => setForm({ ...form, creditPeriodDays: e.target.value })} />
              </div>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Bank Details (Optional)</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input placeholder="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input placeholder="Account number" value={form.bankAccount} onChange={(e) => setForm({ ...form, bankAccount: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input placeholder="IFSC" className="uppercase" value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value.toUpperCase() })} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateVendor.isPending}>
              {updateVendor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vendor?</DialogTitle>
            <DialogDescription>
              Purchase records will be kept but vendor details will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (vendorToDelete) deleteVendor.mutate(vendorToDelete)
              }}
              disabled={deleteVendor.isPending}
            >
              {deleteVendor.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}