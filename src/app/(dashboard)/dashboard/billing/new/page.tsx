'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePOSStore } from '@/stores/pos-store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Minus,
  Search,
  User,
  X,
  Printer,
  RotateCcw,
  Loader2,
  Receipt,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  History,
  Pause,
  Split,
  Scan,
  PackagePlus,
  MapPin,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import type { POSCartItem, Customer } from '@/types'

const paymentModes = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'MIXED', label: 'Mixed', icon: Split },
]

interface ProductResult {
  id: string
  name: string
  sku: string
  barcode?: string
  sellingPrice: number
  mrp?: number
  gstRate: number
  category?: { name: string }
  variants: Array<{
    id: string
    name: string
    sku: string
    barcode?: string
    sellingPrice: number
    mrp?: number
    inventoryStocks: Array<{ quantity: number }>
  }>
  inventoryStocks: Array<{ quantity: number; storeId: string }>
}

interface CustomerSearchResult {
  id: string
  firstName: string
  lastName?: string
  phone?: string
  creditBalance: string
  loyaltyPoints: number
}

export default function POSPage() {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [categories, setCategories] = useState<string[]>(['All'])
  const [products, setProducts] = useState<ProductResult[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [showRecallDialog, setShowRecallDialog] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)
  const [heldBillName, setHeldBillName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([])
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false)
  const [isCharging, setIsCharging] = useState(false)
  const [billDiscount, setBillDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'₹' | '%'>('₹')
  const [paymentNote, setPaymentNote] = useState('')
  const [lastInvoice, setLastInvoice] = useState<Record<string, unknown> | null>(null)
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0)
  // Split payment state
  const [splitPayments, setSplitPayments] = useState<Array<{ method: string; amount: number; reference: string }>>([
    { method: 'CASH', amount: 0, reference: '' }
  ])

  // Locations for counter selector
  const [locations, setLocations] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  // POS Store
  const {
    cart,
    currentCustomer,
    billingType,
    notes,
    heldBills,
    currentStoreId,
    currentLocationId,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setCurrentCustomer,
    setCurrentStore,
    setCurrentLocation,
    setBillingType,
    setNotes,
    holdBill,
    recallBill,
    deleteHeldBill,
    getCartTotal,
    getCartItemCount,
  } = usePOSStore()

  const cartTotal = getCartTotal()
  const cartCount = getCartItemCount()

  // Auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  // Fetch locations for current store (counters)
  useEffect(() => {
    if (!currentStoreId) {
      setLocations([])
      return
    }
    const fetchLocations = async () => {
      setIsLoadingLocations(true)
      try {
        const res = await fetch(`/api/locations?storeId=${currentStoreId}`)
        if (res.ok) {
          const data = await res.json()
          setLocations(data.data || [])
        }
      } catch {
        setLocations([])
      } finally {
        setIsLoadingLocations(false)
      }
    }
    fetchLocations()
  }, [currentStoreId])

  // Set default store (fetch user's first store)
  useEffect(() => {
    if (!currentStoreId) {
      const fetchDefaultStore = async () => {
        try {
          const res = await fetch('/api/stores')
          if (res.ok) {
            const data = await res.json()
            const stores = data.data || []
            if (stores.length > 0) {
              setCurrentStore(stores[0].id)
            }
          }
        } catch {
          // fallback: use first available
        }
      }
      fetchDefaultStore()
    }
  }, [currentStoreId, setCurrentStore])

  // Load products from API
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true)
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('search', searchQuery)
        if (categoryFilter !== 'All') params.set('category', categoryFilter)

        const res = await fetch(`/api/products?${params}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data.data || [])
          // Extract unique categories
          const productCategories = (data.data || []).map((p: ProductResult) => p.category?.name).filter((n: unknown): n is string => Boolean(n))
          const cats = ['All', ...new Set(productCategories)]
          setCategories(cats as string[])
        }
      } catch {
        // Fall back to empty on error
        setProducts([])
      } finally {
        setIsLoadingProducts(false)
      }
    }

    const debounce = setTimeout(loadProducts, searchQuery ? 300 : 0)
    return () => clearTimeout(debounce)
  }, [searchQuery, categoryFilter])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if (e.key === 'F1' && !isInput) {
        e.preventDefault()
        searchRef.current?.focus()
      }
      if (e.key === 'F2' && !isInput) {
        e.preventDefault()
        setShowCustomerDialog(true)
      }
      if (e.key === 'F3' && !isInput && cart.length > 0) {
        e.preventDefault()
        setShowPaymentDialog(true)
      }
      if (e.key === 'F4' && lastInvoice) {
        e.preventDefault()
        setShowReceiptDialog(true)
      }
      if (e.ctrlKey && e.key === 'h' && !isInput) {
        e.preventDefault()
        if (cart.length > 0) setShowHoldDialog(true)
      }
      if (e.ctrlKey && e.key === 'n' && !isInput) {
        e.preventDefault()
        clearCart()
      }
      if (e.key === '?' && !isInput) {
        e.preventDefault()
        setShowShortcutsDialog(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart.length, lastInvoice])

  // Add product to cart
  const handleAddProduct = useCallback((product: ProductResult, variant?: ProductResult['variants'][0]) => {
    const price = variant?.sellingPrice ?? product.sellingPrice
    const sku = variant?.sku ?? product.sku
    const name = variant ? `${product.name} - ${variant.name}` : product.name
    const gstRate = product.gstRate ?? 18
    const quantity = 1
    const subtotal = price * quantity
    const gstAmount = (subtotal * gstRate) / 100
    const totalAmount = subtotal + gstAmount

    addToCart({
      productId: product.id,
      variantId: variant?.id,
      name,
      sku,
      barcode: variant?.barcode ?? product.barcode,
      quantity,
      unitPrice: price,
      discountPercent: 0,
      discountAmount: 0,
      gstRate,
      gstAmount,
      totalAmount,
    })
    toast.success(`Added ${name}`)
  }, [addToCart])

  // Quantity change
  const handleQuantityChange = (productId: string, variantId: string | undefined, delta: number) => {
    const item = cart.find((c) => c.productId === productId && c.variantId === variantId)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeFromCart(productId, variantId)
    } else {
      const subtotal = item.unitPrice * newQty
      const gstAmount = (subtotal * item.gstRate) / 100
      const totalAmount = subtotal + gstAmount - item.discountAmount
      updateCartItem(productId, variantId, { quantity: newQty, totalAmount, gstAmount })
    }
  }

  // Apply bill discount
  const handleBillDiscountChange = (value: number) => {
    setBillDiscount(value)
  }

  // Cart totals with discount and loyalty
  const loyaltyValue = loyaltyPointsToRedeem * 0.25 // ₹0.25 per point
  const afterDiscount = cartTotal.subtotal - billDiscount
  const discountedGst = (afterDiscount * cartTotal.totalGst) / Math.max(cartTotal.subtotal, 1)
  const finalTotal = Math.max(0, Math.round(afterDiscount + discountedGst - loyaltyValue))
  const maxLoyaltyPoints = currentCustomer ? Math.min((currentCustomer as unknown as CustomerSearchResult).loyaltyPoints, Math.floor(finalTotal / 0.25)) : 0

  // Hold bill
  const handleHoldBill = () => {
    if (!heldBillName.trim()) return
    holdBill(heldBillName)
    setHeldBillName('')
    setShowHoldDialog(false)
    toast.success('Bill held successfully')
  }

  // Recall bill
  const handleRecallBill = (heldBillId: string) => {
    recallBill(heldBillId)
    setShowRecallDialog(false)
    toast.success('Bill recalled')
  }

  // Complete sale
  const handleCharge = async () => {
    if (cart.length === 0) return
    setIsCharging(true)
    try {
      // Build payments array
      let paymentsToSend: Array<{ amount: number; method: string; reference: string }>
      if (billingType === 'MIXED') {
        // Use split payments
        const validPayments = splitPayments.filter(p => p.amount > 0)
        if (validPayments.length === 0) {
          toast.error('Please enter at least one payment amount')
          setIsCharging(false)
          return
        }
        const totalPaid = validPayments.reduce((sum, p) => sum + p.amount, 0)
        if (totalPaid < finalTotal) {
          toast.error(`Payment amount (₹${totalPaid.toLocaleString('en-IN')}) is less than total (₹${finalTotal.toLocaleString('en-IN')})`)
          setIsCharging(false)
          return
        }
        paymentsToSend = validPayments.map(p => ({
          amount: p.amount,
          method: p.method,
          reference: p.reference || paymentNote,
        }))
      } else {
        paymentsToSend = [{ amount: finalTotal, method: billingType, reference: paymentNote }]
      }

      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStoreId,
          locationId: currentLocationId,
          customerId: currentCustomer?.id,
          customerName: currentCustomer ? `${currentCustomer.firstName}${currentCustomer.lastName ? ' ' + currentCustomer.lastName : ''}` : 'Walk-in Customer',
          items: cart.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            totalAmount: item.totalAmount,
          })),
          subtotal: cartTotal.subtotal,
          totalDiscount: billDiscount,
          totalGst: cartTotal.totalGst,
          roundOff: 0,
          totalAmount: finalTotal,
          amountPaid: billingType === 'MIXED' ? splitPayments.reduce((sum, p) => sum + p.amount, 0) : finalTotal,
          billingType,
          notes,
          loyaltyPointsUsed: loyaltyPointsToRedeem,
          payments: paymentsToSend,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create invoice')
      }

      const invoice = await res.json()
      setLastInvoice(invoice)
      clearCart()
      setShowPaymentDialog(false)
      setBillDiscount(0)
      setPaymentNote('')
      setLoyaltyPointsToRedeem(0)
      setCurrentCustomer(null)
      setSplitPayments([{ method: 'CASH', amount: 0, reference: '' }])
      toast.success('Sale completed!')
      setShowReceiptDialog(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete sale')
    } finally {
      setIsCharging(false)
    }
  }

  // Search customers
  const handleCustomerSearch = async () => {
    if (!customerPhone.trim()) return
    setIsSearchingCustomer(true)
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(customerPhone)}`)
      if (res.ok) {
        const data = await res.json()
        setCustomerResults(data.data || [])
      }
    } catch {
      setCustomerResults([])
    } finally {
      setIsSearchingCustomer(false)
    }
  }

  // Select customer
  const handleSelectCustomer = (customer: CustomerSearchResult) => {
    setCurrentCustomer({
      id: customer.id,
      tenantId: '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      customerType: 'RETAIL',
      loyaltyPoints: customer.loyaltyPoints,
      creditLimit: '0',
      creditBalance: customer.creditBalance,
      loyaltyMultiplier: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Customer)
    setShowCustomerDialog(false)
    setCustomerPhone('')
    setCustomerResults([])
    toast.success(`Customer: ${customer.firstName}`)
  }

  // Print receipt (browser print)
  const handlePrint = () => {
    setShowReceiptDialog(false)
    window.print()
  }

  const selectedCustomerName = currentCustomer
    ? `${currentCustomer.firstName}${currentCustomer.lastName ? ' ' + currentCustomer.lastName : ''}`
    : 'Walk-in Customer'

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4">
      {/* Left Panel - Product Grid */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border bg-white">
        {/* Search & Category */}
        <div className="border-b p-3 space-y-3">
          {/* Store & Counter selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              {isLoadingLocations ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : locations.length > 0 ? (
                <Select
                  value={currentLocationId || '__all__'}
                  onValueChange={(val) => setCurrentLocation(val === '__all__' ? null : val)}
                >
                  <SelectTrigger className="h-8 text-sm w-full">
                    {currentLocationId
                      ? (() => {
                          const loc = locations.find(l => l.id === currentLocationId)
                          return loc ? loc.name : 'Select counter'
                        })()
                      : 'All Counters'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Counters</SelectItem>
                    {locations
                      .filter((loc) => loc.type === 'COUNTER')
                      .map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    {locations.filter((loc) => loc.type !== 'COUNTER').length > 0 && (
                      <>
                        <SelectItem value="__non-counter__" disabled className="text-xs text-muted-foreground">
                          Other locations
                        </SelectItem>
                        {locations
                          .filter((loc) => loc.type !== 'COUNTER')
                          .map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.name} ({loc.type})
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-muted-foreground">No counters configured</span>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Scan className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search by name, code, or barcode..."
              className="pl-9 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap text-xs"
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoadingProducts ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
              <PackagePlus className="h-8 w-8 mb-2" />
              <p className="text-sm">No products found</p>
              <p className="text-xs">Add products in the catalog first</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => (
                <button
                  key={product.id}
                  className="flex flex-col items-start rounded-lg border bg-card p-3 text-left transition-shadow hover:shadow-md"
                  onClick={() => handleAddProduct(product)}
                >
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Receipt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-bold">₹{Number(product.sellingPrice || 0).toLocaleString('en-IN')}</span>
                    <Badge variant="outline" className="text-xs">{product.gstRate}%</Badge>
                    {product.category && <Badge variant="secondary" className="text-xs">{product.category.name}</Badge>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="border-t p-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowCustomerDialog(true)}
          >
            <User className="h-4 w-4" />
            {currentCustomer ? selectedCustomerName : 'Customer'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowHoldDialog(true)}
            disabled={cart.length === 0}
          >
            <Pause className="h-4 w-4" />
            Hold
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={heldBills.length === 0}
            onClick={() => setShowRecallDialog(true)}
          >
            <History className="h-4 w-4" />
            Saved Bills ({heldBills.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setShowShortcutsDialog(true)}
          >
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">?</kbd>
            Shortcuts
          </Button>
        </div>
      </div>

      {/* Right Panel - Cart / Bill */}
      <div className="flex w-96 flex-col overflow-hidden rounded-lg border bg-white">
        {/* Cart Header */}
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Current Bill</h2>
            <Badge variant="secondary">{cartCount} items</Badge>
          </div>
          {currentCustomer && (
            <div className="mt-2 flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm truncate">{selectedCustomerName}</span>
              {(currentCustomer as unknown as CustomerSearchResult).loyaltyPoints > 0 && (
                <Badge variant="outline" className="ml-auto text-xs">
                  {(currentCustomer as unknown as CustomerSearchResult).loyaltyPoints} pts
                </Badge>
              )}
              <button
                onClick={() => setCurrentCustomer(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Receipt className="mb-2 h-8 w-8" />
              <p className="text-sm">No items added yet</p>
              <p className="text-xs">Search products to add</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.variantId || 'std'}`} className="space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId, item.variantId)}
                      className="ml-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleQuantityChange(item.productId, item.variantId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleQuantityChange(item.productId, item.variantId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      {item.discountAmount > 0 && (
                        <p className="text-xs text-green-600">
                          -₹{item.discountAmount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Summary */}
        <div className="border-t p-3 space-y-2">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{cartTotal.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {billDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({discountType})</span>
                <span>-₹{billDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (GST)</span>
              <span>₹{cartTotal.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {/* Discount input */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setDiscountType(discountType === '₹' ? '%' : '₹')}
              >
                {discountType === '₹' ? '₹' : '%'}
              </Button>
              <Input
                placeholder={`Discount (${discountType})`}
                type="number"
                className="h-8 text-sm"
                value={billDiscount || ''}
                onChange={(e) => handleBillDiscountChange(Number(e.target.value) || 0)}
              />
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>₹{finalTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Payment Mode</Label>
            <div className="grid grid-cols-4 gap-1">
              {paymentModes.map((mode) => (
                <Button
                  key={mode.value}
                  variant={billingType === mode.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex-col h-auto py-1.5 gap-0.5"
                  onClick={() => {
                    setBillingType(mode.value as typeof billingType)
                    if (mode.value === 'MIXED') {
                      setSplitPayments([{ method: 'CASH', amount: 0, reference: '' }])
                    }
                  }}
                >
                  <mode.icon className="h-4 w-4" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setShowReceiptDialog(true)}
              disabled={!lastInvoice}
            >
              <Printer className="h-3.5 w-3.5" />
              Receipt
            </Button>
          </div>
          <Button
            size="lg"
            className="w-full gap-2"
            disabled={cart.length === 0 || isCharging}
            onClick={() => setShowPaymentDialog(true)}
          >
            {isCharging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IndianRupee className="h-4 w-4" />
            )}
            Charge ₹{finalTotal.toLocaleString('en-IN')}
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className={billingType === 'MIXED' ? 'max-w-lg' : 'max-w-md'}>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Amount to Collect</p>
              <p className="text-4xl font-bold">₹{finalTotal.toLocaleString('en-IN')}</p>
            </div>

            {billingType === 'MIXED' ? (
              /* Split Payment UI */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Split Payment</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSplitPayments([...splitPayments, { method: 'CASH', amount: 0, reference: '' }])}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Payment
                  </Button>
                </div>
                {splitPayments.map((payment, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={payment.method}
                      onValueChange={(v) => {
                        const newPayments = [...splitPayments]
                        newPayments[idx] = { ...newPayments[idx], method: v || 'CASH' }
                        setSplitPayments(newPayments)
                      }}
                    >
                      <SelectTrigger className="w-28">
                        {payment.method === 'CASH' ? 'Cash' : payment.method === 'UPI' ? 'UPI' : payment.method === 'CARD' ? 'Card' : payment.method}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="CARD">Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      value={payment.amount || ''}
                      onChange={(e) => {
                        const newPayments = [...splitPayments]
                        newPayments[idx] = { ...newPayments[idx], amount: parseFloat(e.target.value) || 0 }
                        setSplitPayments(newPayments)
                      }}
                      placeholder="₹0"
                      className="flex-1"
                    />
                    <Input
                      value={payment.reference}
                      onChange={(e) => {
                        const newPayments = [...splitPayments]
                        newPayments[idx] = { ...newPayments[idx], reference: e.target.value }
                        setSplitPayments(newPayments)
                      }}
                      placeholder="Ref (optional)"
                      className="w-32"
                    />
                    {splitPayments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== idx))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between text-sm">
                  <span>Total Paid:</span>
                  <span className={splitPayments.reduce((sum, p) => sum + p.amount, 0) < finalTotal ? 'text-red-600 font-medium' : 'font-medium'}>
                    ₹{splitPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
                    {splitPayments.reduce((sum, p) => sum + p.amount, 0) < finalTotal && ` (₹${(finalTotal - splitPayments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString('en-IN')} remaining)`}
                  </span>
                </div>
              </div>
            ) : (
              /* Single Payment UI */
              <div className="space-y-2">
                <Label>Payment Note (optional)</Label>
                <Input
                  placeholder="e.g. Card ending 4242"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>
            )}
            {currentCustomer && (currentCustomer as unknown as CustomerSearchResult).loyaltyPoints > 0 && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Redeem Loyalty Points</p>
                    <p className="text-xs text-muted-foreground">
                      {(currentCustomer as unknown as CustomerSearchResult).loyaltyPoints} points available • 1 pt = ₹0.25
                    </p>
                  </div>
                  <Badge variant="outline">₹{loyaltyValue.toFixed(2)} off</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={maxLoyaltyPoints}
                    value={loyaltyPointsToRedeem}
                    onChange={(e) => setLoyaltyPointsToRedeem(Math.min(maxLoyaltyPoints, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-24"
                    placeholder="0"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLoyaltyPointsToRedeem(maxLoyaltyPoints)}
                    disabled={maxLoyaltyPoints === 0}
                  >
                    Max
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-col">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCharge} className="gap-2" disabled={isCharging}>
              {isCharging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone or Name</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                />
                <Button onClick={handleCustomerSearch} disabled={isSearchingCustomer}>
                  {isSearchingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {/* Customer results */}
            {customerResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left p-3 rounded-lg border hover:bg-muted transition-colors"
                    onClick={() => handleSelectCustomer(c)}
                  >
                    <p className="font-medium">{c.firstName}{c.lastName ? ' ' + c.lastName : ''}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                    {parseFloat(c.creditBalance) > 0 && (
                      <Badge variant="destructive" className="mt-1 text-xs">Due: ₹{parseFloat(c.creditBalance).toLocaleString('en-IN')}</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCurrentCustomer(null)}
            >
              Walk-in Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hold Bill Dialog */}
      <Dialog open={showHoldDialog} onOpenChange={setShowHoldDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hold Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bill Name</Label>
              <Input
                placeholder="e.g. Table 5, Ramesh"
                value={heldBillName}
                onChange={(e) => setHeldBillName(e.target.value)}
              />
            </div>
            <Button onClick={handleHoldBill} className="w-full" disabled={!heldBillName.trim()}>
              Hold Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recall Bill Dialog */}
      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recall Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {heldBills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No held bills</p>
            ) : (
              heldBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {bill.items.length} items • {new Date(bill.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleRecallBill(bill.id)}>
                      Recall
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteHeldBill(bill.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bill Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Sale completed successfully
            </p>
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-col">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              New Sale
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Search products</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">F1</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Select customer</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">F2</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Open payment</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">F3</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Print receipt</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">F4</kbd>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Hold bill</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">Ctrl+H</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">New bill</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">Ctrl+N</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show shortcuts</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">?</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Close dialog</span>
              <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">Esc</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
