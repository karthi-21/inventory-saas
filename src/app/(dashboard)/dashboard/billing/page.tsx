'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Receipt,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Loader2,
  AlertCircle,
  Store,
  XCircle,
  RotateCcw,
  Printer,
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
  store: { name: string; address?: string; gstin?: string }
  customer?: { firstName: string; lastName?: string; phone?: string } | null
  customerName?: string
  subtotal?: number
  totalDiscount?: number
  totalGst?: number
  roundOff?: number
  totalAmount: number
  amountPaid: number
  amountDue: number
  paymentStatus: string
  invoiceStatus: string
  billingType: string
  cancelReason?: string
  items: Array<{ id: string }>
  createdAt: string
}

const CANCEL_REASONS = [
  'Mistake in billing',
  'Customer request',
  'Duplicate bill',
  'Wrong customer',
  'Wrong items',
  'Other',
]

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [storeFilter, setStoreFilter] = useState<string>('__all__')
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [returnItems, setReturnItems] = useState<Array<{ productId?: string; variantId?: string; name: string; quantity: number; maxQty: number; unitPrice: number; amount: number }>>([])
  const [returnReason, setReturnReason] = useState('')
  const currentStoreId = usePOSStore((state) => state.currentStoreId)
  const queryClient = useQueryClient()

  // Effective store ID for filtering
  const effectiveStoreId = storeFilter === '__all__' ? currentStoreId : storeFilter === '__none__' ? undefined : storeFilter

  // Fetch stores for filter dropdown
  const { data: stores } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
  })

  // Fetch invoices
  const { data: invoicesData, isLoading, error } = useQuery<{ data: Invoice[]; pagination: { total: number } }>({
    queryKey: ['invoices', searchQuery, statusFilter, effectiveStoreId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (effectiveStoreId) params.set('storeId', effectiveStoreId)
      const res = await fetch(`/api/billing?${params}`)
      if (!res.ok) throw new Error('Failed to fetch invoices')
      return res.json()
    },
  })

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const reason = cancelReason === 'Other' ? customReason : cancelReason
      const res = await fetch(`/api/billing/${invoiceId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel invoice')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Bill cancelled successfully')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setCancelDialogOpen(false)
      setSelectedInvoice(null)
      setCancelReason('')
      setCustomReason('')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  // Return mutation
  const returnMutation = useMutation({
    mutationFn: async ({ invoiceId, items, reason }: { invoiceId: string; items: typeof returnItems; reason: string }) => {
      const res = await fetch(`/api/billing/${invoiceId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.filter(i => i.quantity > 0).map(i => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            amount: i.quantity * i.unitPrice,
          })),
          reason,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to process return')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Return processed successfully')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setReturnDialogOpen(false)
      setSelectedInvoice(null)
      setReturnItems([])
      setReturnReason('')
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const invoices = invoicesData?.data || []
  const activeInvoices = invoices.filter(inv => inv.invoiceStatus !== 'CANCELLED')
  const totalSales = activeInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
  const paidCount = activeInvoices.filter((inv) => inv.paymentStatus === 'PAID').length
  const pendingAmount = activeInvoices.filter((inv) => inv.paymentStatus !== 'PAID').reduce((sum, inv) => sum + Number(inv.amountDue), 0)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">Failed to load bills</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">Manage bills and sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => {
            if (invoices.length === 0) {
              toast.error('No bills to export')
              return
            }
            const csvData = invoices.map((inv) => ({
              BillNumber: inv.invoiceNumber,
              Customer: inv.customer
                ? `${inv.customer.firstName}${inv.customer.lastName ? ' ' + inv.customer.lastName : ''}`
                : 'Walk-in Customer',
              Date: new Date(inv.invoiceDate).toLocaleDateString('en-IN'),
              Store: inv.store?.name || '',
              TotalAmount: Number(inv.totalAmount),
              AmountPaid: Number(inv.amountPaid),
              AmountDue: Number(inv.amountDue),
              Status: inv.invoiceStatus === 'CANCELLED' ? 'CANCELLED' : inv.paymentStatus,
              BillingType: inv.billingType,
            }))
            exportToCSV(csvData, `bills-${new Date().toISOString().split('T')[0]}.csv`)
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
              <p className="text-sm text-muted-foreground">Paid Bills</p>
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
            placeholder="Search by bill no. or customer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(stores || []).length > 1 && (
          <Select value={storeFilter} onValueChange={(v) => v && setStoreFilter(v)}>
            <SelectTrigger className="w-48">
              <Store className="h-4 w-4 mr-2 text-muted-foreground" />
              {storeFilter === '__all__' ? 'Current Store'
                : storeFilter === '__none__' ? 'All Stores'
                : (stores || []).find(s => s.id === storeFilter)?.name ?? 'Current Store'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Current Store</SelectItem>
              <SelectItem value="__none__">All Stores</SelectItem>
              {(stores || []).map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-40">
            {statusFilter === 'all' ? 'All Status'
              : statusFilter === 'PAID' ? 'Paid'
              : statusFilter === 'PARTIAL' ? 'Partial'
              : statusFilter === 'DUE' ? 'Due'
              : statusFilter === 'CANCELLED' ? 'Cancelled'
              : 'All Status'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="DUE">Due</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
              <p className="text-lg font-medium">No bills yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first sale to see bills here</p>
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
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className={invoice.invoiceStatus === 'CANCELLED' ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoiceNumber}
                      {invoice.invoiceStatus === 'CANCELLED' && (
                        <span className="ml-2 text-xs text-red-500 line-through">CANCELLED</span>
                      )}
                    </TableCell>
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
                      <Badge
                        variant={
                          invoice.invoiceStatus === 'CANCELLED' ? 'destructive' :
                          invoice.paymentStatus === 'PAID' ? 'default' :
                          invoice.paymentStatus === 'DUE' ? 'destructive' :
                          'outline'
                        }
                      >
                        {invoice.invoiceStatus === 'CANCELLED' ? 'CANCELLED' : invoice.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {invoice.invoiceStatus !== 'CANCELLED' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={async () => {
                                // Fetch invoice details to get items
                                const res = await fetch(`/api/billing?search=${invoice.invoiceNumber}`)
                                if (res.ok) {
                                  const data = await res.json()
                                  const detailed = data.data?.find((inv: Invoice) => inv.id === invoice.id)
                                  if (detailed) {
                                    setSelectedInvoice(detailed)
                                  } else {
                                    setSelectedInvoice(invoice)
                                  }
                                } else {
                                  setSelectedInvoice(invoice)
                                }
                                // Fetch items for return
                                const itemsRes = await fetch(`/api/billing/${invoice.id}/items`)
                                if (itemsRes.ok) {
                                  const itemsData = await itemsRes.json()
                                  setReturnItems((itemsData.data || itemsData || []).map((item: { productId?: string; variantId?: string; product?: { name: string }; variant?: { name: string }; description?: string; quantity: number; unitPrice: number }) => ({
                                    productId: item.productId || undefined,
                                    variantId: item.variantId || undefined,
                                    name: item.product?.name || item.description || item.variant?.name || 'Unknown',
                                    quantity: 0,
                                    maxQty: item.quantity,
                                    unitPrice: Number(item.unitPrice),
                                    amount: 0,
                                  })))
                                }
                                setReturnDialogOpen(true)
                              }}
                              title="Return Items"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedInvoice(invoice)
                                setCancelDialogOpen(true)
                              }}
                              title="Cancel Bill"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/print/receipt', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  invoiceNumber: invoice.invoiceNumber,
                                  invoiceDate: invoice.invoiceDate,
                                  storeName: invoice.store?.name || '',
                                  storeAddress: invoice.store?.address || '',
                                  storeGstin: invoice.store?.gstin || '',
                                  customerName: invoice.customerName || 'Walk-in Customer',
                                  customerPhone: invoice.customer?.phone || '',
                                  items: [],
                                  subtotal: Number(invoice.subtotal || 0),
                                  totalDiscount: Number(invoice.totalDiscount || 0),
                                  totalGst: Number(invoice.totalGst || 0),
                                  roundOff: Number(invoice.roundOff || 0),
                                  totalAmount: Number(invoice.totalAmount || 0),
                                  amountPaid: Number(invoice.amountPaid || 0),
                                  amountDue: Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0),
                                  paymentMethod: invoice.billingType || '',
                                }),
                              })
                              if (res.ok) {
                                const html = await res.text()
                                const w = window.open('', '_blank', 'width=320,height=600')
                                if (w) { w.document.write(html); w.document.close(); w.print() }
                              } else {
                                toast.error('Failed to generate receipt')
                              }
                            } catch {
                              toast.error('Failed to print receipt')
                            }
                          }}
                          title="Reprint Receipt"
                        >
                          <Printer className="h-4 w-4" />
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

      {/* Cancel Bill Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Bill</DialogTitle>
            <DialogDescription>
              Cancel this bill? <strong>{selectedInvoice?.invoiceNumber}</strong> — stock will be put back.
              {selectedInvoice && Number(selectedInvoice.amountPaid) > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  This bill has payments. Please give refund first.
                </span>
              )}
              You cannot undo this.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{Number(selectedInvoice.totalAmount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">
                    {selectedInvoice.customer
                      ? `${selectedInvoice.customer.firstName}${selectedInvoice.customer.lastName ? ' ' + selectedInvoice.customer.lastName : ''}`
                      : 'Walk-in Customer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{selectedInvoice.items?.length || 0}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for cancellation</label>
                <Select value={cancelReason} onValueChange={(v) => v && setCancelReason(v)}>
                  <SelectTrigger>
                    {cancelReason || 'Select a reason...'}
                  </SelectTrigger>
                  <SelectContent>
                    {CANCEL_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cancelReason === 'Other' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Please specify the reason</label>
                  <Input
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter reason for cancellation"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCancelDialogOpen(false)
              setCancelReason('')
              setCustomReason('')
            }}>
              Don&apos;t Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelReason || (cancelReason === 'Other' && !customReason.trim()) || cancelMutation.isPending}
              onClick={() => {
                if (selectedInvoice) {
                  cancelMutation.mutate(selectedInvoice.id)
                }
              }}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Bill'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Items Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Items</DialogTitle>
            <DialogDescription>
              Select items to return from bill <strong>{selectedInvoice?.invoiceNumber}</strong>.
              Items go back to stock. Money adjusted in customer&apos;s account.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {returnItems.length > 0 ? (
                <div className="space-y-3">
                  {returnItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-2 border rounded-md">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ₹{item.unitPrice.toLocaleString('en-IN')} × max {item.maxQty}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            const newItems = [...returnItems]
                            newItems[idx] = { ...newItems[idx], quantity: Math.max(0, newItems[idx].quantity - 1), amount: Math.max(0, newItems[idx].quantity - 1) * newItems[idx].unitPrice }
                            setReturnItems(newItems)
                          }}
                          disabled={item.quantity <= 0}
                        >
                          -
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            const newItems = [...returnItems]
                            const newQty = Math.min(item.maxQty, item.quantity + 1)
                            newItems[idx] = { ...newItems[idx], quantity: newQty, amount: newQty * newItems[idx].unitPrice }
                            setReturnItems(newItems)
                          }}
                          disabled={item.quantity >= item.maxQty}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Total Return Amount:</span>
                    <span>₹{returnItems.reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading items...</p>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for return (optional)</label>
                <Input
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g., Defective product, Customer not satisfied"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setReturnDialogOpen(false)
              setReturnItems([])
              setReturnReason('')
            }}>
              Cancel
            </Button>
            <Button
              disabled={returnItems.every(i => i.quantity === 0) || returnMutation.isPending}
              onClick={() => {
                if (selectedInvoice) {
                  returnMutation.mutate({ invoiceId: selectedInvoice.id, items: returnItems, reason: returnReason })
                }
              }}
            >
              {returnMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Return'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}