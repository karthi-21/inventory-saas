'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  Loader2,
  Building,
  Package,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  vendor: { id: string; name: string; phone?: string }
  store: { id: string; name: string }
  subtotal: number
  totalGst: number
  totalAmount: number
  amountPaid: number
  status: string
  items: Array<{
    id: string
    productId: string | null
    product?: { name: string; sku: string }
    quantity: number
    unitPrice: number
    gstRate: number
    totalAmount: number
  }>
  createdAt: string
}

interface Vendor {
  id: string
  name: string
  phone?: string
  gstin?: string
}

interface Product {
  id: string
  name: string
  sku: string
  sellingPrice: number
  gstRate: number
}

interface Store {
  id: string
  name: string
}

export default function PurchasesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showNewDialog, setShowNewDialog] = useState(false)
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    vendorId: '',
    storeId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ productId: '', quantity: '1', unitPrice: '', gstRate: '18' }] as Array<{
      productId: string
      quantity: string
      unitPrice: string
      gstRate: string
    }>
  })

  // Fetch purchase invoices
  const { data: invoicesData, isLoading, error } = useQuery<{ data: PurchaseInvoice[]; pagination: { total: number } }>({
    queryKey: ['purchase-invoices', searchQuery, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/purchase-invoices?${params}`)
      if (!res.ok) throw new Error('Failed to fetch purchase invoices')
      return res.json()
    },
  })

  // Fetch vendors for dropdown
  const { data: vendorsData } = useQuery<{ data: Vendor[] }>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/api/vendors')
      if (!res.ok) throw new Error('Failed to fetch vendors')
      return res.json()
    },
  })

  // Fetch stores for dropdown
  const { data: storesData } = useQuery<{ data: Store[] }>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      return res.json()
    },
  })

  // Fetch products for dropdown
  const { data: productsData } = useQuery<{ data: Product[] }>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
  })

  // Create purchase invoice mutation
  const createInvoice = useMutation({
    mutationFn: async (data: typeof form) => {
      const items = data.items.map(item => {
        const product = productsData?.data?.find(p => p.id === item.productId)
        const qty = Number(item.quantity) || 0
        const price = Number(item.unitPrice) || 0
        const gstRate = Number(item.gstRate) || 18
        const amount = qty * price
        const gstAmount = (amount * gstRate) / 100
        return {
          productId: item.productId || null,
          quantity: qty,
          unitPrice: price,
          gstRate,
          gstAmount,
          totalAmount: amount + gstAmount,
          receiveNow: true // Auto-receive stock
        }
      })

      const res = await fetch('/api/purchase-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: data.vendorId,
          storeId: data.storeId,
          invoiceNumber: data.invoiceNumber || undefined,
          invoiceDate: data.invoiceDate,
          notes: data.notes || undefined,
          items
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create purchase invoice')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Purchase invoice created successfully')
      setShowNewDialog(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create purchase invoice')
    },
  })

  const resetForm = () => {
    setForm({
      vendorId: '',
      storeId: storesData?.data?.[0]?.id || '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ productId: '', quantity: '1', unitPrice: '', gstRate: '18' }]
    })
  }

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { productId: '', quantity: '1', unitPrice: '', gstRate: '18' }]
    })
  }

  const removeItem = (index: number) => {
    if (form.items.length > 1) {
      setForm({
        ...form,
        items: form.items.filter((_, i) => i !== index)
      })
    }
  }

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...form.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Auto-fill price and GST from product
    if (field === 'productId') {
      const product = productsData?.data?.find(p => p.id === value)
      if (product) {
        newItems[index].unitPrice = String(product.sellingPrice)
        newItems[index].gstRate = String(product.gstRate)
      }
    }

    setForm({ ...form, items: newItems })
  }

  const handleSubmit = () => {
    if (!form.vendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (!form.storeId) {
      toast.error('Please select a store')
      return
    }
    if (form.items.some(item => !item.productId || !item.quantity)) {
      toast.error('Please fill all product items')
      return
    }
    createInvoice.mutate(form)
  }

  const invoices = invoicesData?.data || []
  const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const totalPending = invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + Number(inv.totalAmount - inv.amountPaid), 0)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">Failed to load purchase invoices</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchases</h1>
          <p className="text-sm text-muted-foreground">Record purchases and manage vendor invoices</p>
        </div>
        <Button onClick={() => { resetForm(); setShowNewDialog(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Purchase
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
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold">₹{(totalPurchases / 100000).toFixed(1)}L</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bills</p>
              <p className="text-2xl font-bold">{invoices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Building className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Payment</p>
              <p className="text-2xl font-bold">₹{(totalPending / 100000).toFixed(1)}L</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice or vendor..."
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
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No purchase bills yet</p>
              <p className="text-sm text-muted-foreground mb-4">Record your first purchase from a vendor</p>
              <Button onClick={() => { resetForm(); setShowNewDialog(true) }}>
                <Plus className="h-4 w-4 mr-2" /> New Purchase
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="font-medium">{invoice.vendor.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell>{invoice.store.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(invoice.totalAmount).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₹{Number(invoice.amountPaid).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'PAID' ? 'default' : invoice.status === 'PENDING' ? 'destructive' : 'outline'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Purchase Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Purchase Bill</DialogTitle>
            <DialogDescription>Record a purchase from a vendor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select value={form.vendorId || ''} onValueChange={(v) => setForm({ ...form, vendorId: v || '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorsData?.data?.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Store *</Label>
                <Select value={form.storeId || ''} onValueChange={(v) => setForm({ ...form, storeId: v || '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {storesData?.data?.map((store) => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bill Number</Label>
                <Input placeholder="Auto-generated if empty" value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bill Date</Label>
                <Input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })} />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Products</Label>
                <Button variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
              </div>
              {form.items.map((item, index) => {
                const product = productsData?.data?.find(p => p.id === item.productId)
                const qty = Number(item.quantity) || 0
                const price = Number(item.unitPrice) || 0
                const gstRate = Number(item.gstRate) || 18
                const lineTotal = qty * price * (1 + gstRate / 100)

                return (
                  <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1">
                      <Select value={item.productId || ''} onValueChange={(v) => updateItem(index, 'productId', v || '')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {productsData?.data?.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id}>{prod.name} ({prod.sku})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      type="number"
                      placeholder="Qty"
                      className="w-20"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      className="w-28"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="GST%"
                      className="w-20"
                      value={item.gstRate}
                      onChange={(e) => updateItem(index, 'gstRate', e.target.value)}
                    />
                    <div className="w-24 text-right font-medium">
                      ₹{lineTotal.toFixed(0)}
                    </div>
                    {form.items.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeItem(index)}>
                        ×
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Optional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
              {createInvoice.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}