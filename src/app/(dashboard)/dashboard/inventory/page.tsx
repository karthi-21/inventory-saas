'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingDown,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  Hash,
  Box,
  ArrowUpDown,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { usePOSStore } from '@/stores/pos-store'
import { ImageUpload } from '@/components/ui/image-upload'
import type { InventoryStock, Product, Store, Location } from '@/types'

interface CSVRow {
  name: string
  sku?: string
  barcode?: string
  category?: string
  brand?: string
  hsnCode?: string
  gstRate?: string | number
  mrp?: string | number
  costPrice?: string | number
  sellingPrice?: string | number
  reorderLevel?: string | number
}

interface ProductResponse {
  data: Array<Product & { category?: { name: string }; variants: Array<{ id: string; name: string; sku: string; sellingPrice: number }> }>
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

interface InventoryWithDetails extends InventoryStock {
  product: Product
  store: Store
  location: Location
  batchNumber?: string | null
  expiryDate?: Date | string | null
}

interface InventoryResponse {
  data: InventoryWithDetails[]
  total: number
}

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryWithDetails | null>(null)
  const { currentStoreId } = usePOSStore()
  const [selectedStore, setSelectedStore] = useState<string>(currentStoreId || 'all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')

  // Sync selected store with global store context
  useEffect(() => {
    if (currentStoreId) {
      setSelectedStore(currentStoreId)
      setSelectedLocation('all')
    }
  }, [currentStoreId])
  // Separate dialog for adding a new product (vs adding stock)
  const [showAddProductDialog, setShowAddProductDialog] = useState(false)

  // Form state for stock adjustment
  const [stockForm, setStockForm] = useState({
    productId: '',
    storeId: '',
    locationId: '',
    quantity: '',
    type: 'purchase',
    reason: '',
    notes: '',
    batchNumber: '',
    expiryDate: '',
  })

  // Form state for add product
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brand: '',
    hsnCode: '',
    gstRate: '18',
    mrp: '',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: '10',
    hasVariants: false,
    imageUrls: [] as string[],
  })

  // CSV import state
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const queryClient = useQueryClient()

  // Fetch inventory
  const { data: inventoryData, isLoading, error } = useQuery<InventoryResponse>({
    queryKey: ['inventory', selectedStore, selectedLocation],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedStore && selectedStore !== 'all') params.set('storeId', selectedStore)
      if (selectedLocation && selectedLocation !== 'all') params.set('locationId', selectedLocation)
      if (activeTab === 'low') params.set('lowStock', 'true')
      const res = await fetch(`/api/inventory?${params}`)
      if (!res.ok) throw new Error('Failed to fetch inventory')
      return res.json()
    },
  })

  // Fetch locations for selected store
  const { data: locations } = useQuery<Array<{ id: string; name: string; type: string }>>({
    queryKey: ['locations', selectedStore],
    queryFn: async () => {
      if (!selectedStore || selectedStore === 'all') return []
      const res = await fetch(`/api/locations?storeId=${selectedStore}`)
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
    enabled: !!selectedStore && selectedStore !== 'all',
  })

  // Fetch stores for dropdown
  const { data: stores } = useQuery<Store[]>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      const data = await res.json()
      return data.data || []
    },
  })

  // Fetch products for products tab
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<ProductResponse>({
    queryKey: ['products', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      return res.json()
    },
  })

  // Fetch categories for product form
  const { data: categories } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      return data.data || []
    },
    enabled: showAddProductDialog || showAddDialog,
  })

  // Add stock mutation
  const addStock = useMutation({
    mutationFn: async (data: typeof stockForm) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: data.productId,
          storeId: data.storeId,
          locationId: data.locationId,
          quantity: parseInt(data.quantity),
          type: data.type,
          reason: data.reason,
          notes: data.notes,
          batchNumber: data.batchNumber,
          expiryDate: data.expiryDate || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to add stock')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      toast.success('Stock added successfully')
      setShowAddDialog(false)
      resetStockForm()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetStockForm = () => {
    setStockForm({
      productId: '',
      storeId: '',
      locationId: '',
      quantity: '',
      type: 'purchase',
      reason: '',
      notes: '',
      batchNumber: '',
      expiryDate: '',
    })
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const res = await fetch(`/api/reports?type=inventory&format=${format}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-report.${format}`
      a.click()
      toast.success(`Exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed')
    }
  }

  const handleRowClick = (item: InventoryWithDetails) => {
    setSelectedProduct(item)
    setShowProductDetail(true)
  }

  const filteredInventory = inventoryData?.data?.filter((item) => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'all') return matchesSearch
    if (activeTab === 'products') return false // products tab has its own table
    if (activeTab === 'low') {
      return matchesSearch && item.quantity <= (item.product?.reorderLevel || 0) && item.quantity > 0
    }
    if (activeTab === 'out') return matchesSearch && item.quantity === 0
    if (activeTab === 'expiry') {
      // Check if expiry date is within 7 days
      if (!item.expiryDate) return false
      const expiry = new Date(item.expiryDate)
      const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return matchesSearch && daysUntilExpiry <= 7 && daysUntilExpiry >= 0
    }
    return matchesSearch
  }) || []

  const totalProducts = inventoryData?.data?.length || 0
  const lowStockCount = inventoryData?.data?.filter(
    (i) => i.quantity <= (i.product?.reorderLevel || 0) && i.quantity > 0
  ).length || 0
  const outOfStockCount = inventoryData?.data?.filter((i) => i.quantity === 0).length || 0
  const expiringSoonCount = inventoryData?.data?.filter((i) => {
    if (!i.expiryDate) return false
    const expiry = new Date(i.expiryDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }).length || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-muted-foreground">Failed to load inventory</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['inventory'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock</h1>
          <p className="text-sm text-muted-foreground">Track and manage your stock across all stores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-yellow-300' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? 'border-red-300' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card className={expiringSoonCount > 0 ? 'border-orange-300' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{expiringSoonCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Label htmlFor="inventory-search" className="sr-only">Search inventory</Label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="inventory-search"
            placeholder="Search by name or code..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedStore} onValueChange={(v) => { setSelectedStore(v || 'all'); setSelectedLocation('all'); }} aria-label="Filter by store">
          <SelectTrigger className="w-48">
            {selectedStore === 'all' ? 'All Stores' : stores?.find(s => s.id === selectedStore)?.name ?? 'All Stores'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores?.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedStore !== 'all' && locations && locations.length > 0 && (
          <Select value={selectedLocation} onValueChange={(v) => v && setSelectedLocation(v)} aria-label="Filter by location">
            <SelectTrigger className="w-44">
              {selectedLocation === 'all' ? 'All Locations' : locations?.find(l => l.id === selectedLocation)?.name ?? 'All Locations'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name} ({loc.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="low">Low Stock</TabsTrigger>
            <TabsTrigger value="out">Out</TabsTrigger>
            <TabsTrigger value="expiry">Expiry</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Products</CardTitle>
                <Badge variant="secondary">{productsData?.pagination?.total ?? 0}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Import CSV
                </Button>
                <Button size="sm" onClick={() => setShowAddProductDialog(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Product search (reuse global search) */}
            <Label htmlFor="products-search" className="sr-only">Search products</Label>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="products-search"
                placeholder="Search by name, code, or barcode..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : productsData?.data?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No products yet</p>
                <p className="text-sm text-muted-foreground mb-4">Add products manually or import from CSV</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowImportDialog(true)}>Import CSV</Button>
                  <Button onClick={() => setShowAddDialog(true)}>Add Product</Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>GST</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData?.data?.map((product) => (
                    <TableRow key={product.id} className="cursor-pointer">
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{product.sku}</TableCell>
                      <TableCell>{product.category?.name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{Number(product.sellingPrice || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{Number(product.mrp || 0).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right">
                        {(product as Product & { availableStock?: number }).availableStock ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.gstRate || 18}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
                <TableHead>Batch/Expiry</TableHead>
                <TableHead className="text-right">MRP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow
                  key={item.id}
                  className={`cursor-pointer ${
                    item.quantity === 0
                      ? 'bg-red-50 dark:bg-red-950/10'
                      : item.quantity <= (item.product?.reorderLevel || 0)
                      ? 'bg-yellow-50 dark:bg-yellow-950/10'
                      : ''
                  }`}
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.quantity === 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      {item.product?.name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {item.product?.sku || '-'}
                  </TableCell>
                  <TableCell>{item.store?.name || '-'}</TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      item.quantity === 0
                        ? 'text-red-600'
                        : item.quantity <= (item.product?.reorderLevel || 0)
                        ? 'text-yellow-600'
                        : ''
                    }`}
                  >
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.product?.reorderLevel || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      {item.batchNumber && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Hash className="h-3 w-3" />
                          {item.batchNumber}
                        </div>
                      )}
                      {item.expiryDate && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.expiryDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                      {!item.batchNumber && !item.expiryDate && '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(item.product?.mrp || 0).toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredInventory.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Add products to get started'}
          </p>
        </div>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>Record a purchase, adjustment, or opening stock entry.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              addStock.mutate(stockForm)
            }}
          >
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={stockForm.productId}
                  onValueChange={(v) => v && setStockForm({ ...stockForm, productId: v })}
                >
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData?.data?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="store">Store *</Label>
                  <Select
                    value={stockForm.storeId}
                    onValueChange={(v) => v && setStockForm({ ...stockForm, storeId: v })}
                  >
                    <SelectTrigger id="store">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores?.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="0"
                    value={stockForm.quantity}
                    onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Entry Type</Label>
                <Select
                  value={stockForm.type}
                  onValueChange={(v) => v && setStockForm({ ...stockForm, type: v })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase Entry</SelectItem>
                    <SelectItem value="opening">Opening Stock</SelectItem>
                    <SelectItem value="adjustment">Stock Adjustment</SelectItem>
                    <SelectItem value="return">Sales Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Number</Label>
                  <Input
                    id="batch"
                    placeholder="e.g. B1234"
                    value={stockForm.batchNumber}
                    onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={stockForm.expiryDate}
                    onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Reference number, vendor details, etc."
                  value={stockForm.notes}
                  onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={addStock.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addStock.isPending}>
                {addStock.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      {/* Add Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={(open) => {
        setShowAddProductDialog(open)
        if (!open) setProductForm({ name: '', sku: '', barcode: '', categoryId: '', brand: '', hsnCode: '', gstRate: '18', mrp: '', costPrice: '', sellingPrice: '', reorderLevel: '10', hasVariants: false, imageUrls: [] })
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Fill in product details. Fields marked * are required.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              try {
                const res = await fetch('/api/products', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: productForm.name,
                    sku: productForm.sku || undefined,
                    barcode: productForm.barcode || undefined,
                    categoryId: productForm.categoryId || undefined,
                    brand: productForm.brand || undefined,
                    hsnCode: productForm.hsnCode || undefined,
                    gstRate: parseFloat(productForm.gstRate) || 18,
                    mrp: parseFloat(productForm.mrp) || 0,
                    costPrice: parseFloat(productForm.costPrice) || 0,
                    sellingPrice: parseFloat(productForm.sellingPrice) || 0,
                    reorderLevel: parseInt(productForm.reorderLevel) || 10,
                    hasVariants: productForm.hasVariants,
                    imageUrls: productForm.imageUrls,
                  })
                })
                if (!res.ok) throw new Error('Failed to create product')
                toast.success('Product created successfully')
                queryClient.invalidateQueries({ queryKey: ['products'] })
                setShowAddDialog(false)
              } catch {
                toast.error('Failed to create product')
              }
            }}
          >
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="prod-name">Name *</Label>
                <Input
                  id="prod-name"
                  placeholder="e.g. Samsung 43 Smart TV"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-sku">Product Code</Label>
                  <Input
                    id="prod-sku"
                    placeholder="Auto-generated if empty"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-barcode">Barcode</Label>
                  <Input
                    id="prod-barcode"
                    placeholder="Scan or type barcode"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prod-category">Category</Label>
                <Select value={productForm.categoryId} onValueChange={(v) => setProductForm({ ...productForm, categoryId: v || '' })}>
                  <SelectTrigger id="prod-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-brand">Brand</Label>
                  <Input
                    id="prod-brand"
                    placeholder="e.g. Samsung"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-hsn">HSN Code</Label>
                  <Input
                    id="prod-hsn"
                    placeholder="e.g. 8528"
                    value={productForm.hsnCode}
                    onChange={(e) => setProductForm({ ...productForm, hsnCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-mrp">MRP (₹)</Label>
                  <Input
                    id="prod-mrp"
                    type="number"
                    placeholder="0"
                    value={productForm.mrp}
                    onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-cost">Cost (₹)</Label>
                  <Input
                    id="prod-cost"
                    type="number"
                    placeholder="0"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-selling">Selling (₹)</Label>
                  <Input
                    id="prod-selling"
                    type="number"
                    placeholder="0"
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-gst">GST Rate (%)</Label>
                  <Select value={productForm.gstRate} onValueChange={(v) => v && setProductForm({ ...productForm, gstRate: v })}>
                    <SelectTrigger id="prod-gst">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="12">12%</SelectItem>
                      <SelectItem value="18">18%</SelectItem>
                      <SelectItem value="28">28%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prod-reorder">Min Stock</Label>
                  <Input
                    id="prod-reorder"
                    type="number"
                    placeholder="10"
                    value={productForm.reorderLevel}
                    onChange={(e) => setProductForm({ ...productForm, reorderLevel: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="prod-variants"
                    checked={productForm.hasVariants}
                    onChange={(e) => setProductForm({ ...productForm, hasVariants: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="prod-variants" className="font-normal cursor-pointer">
                    This product has variants (sizes, colors, etc.)
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Product Images
                </Label>
                <ImageUpload
                  value={productForm.imageUrls}
                  onChange={(urls) => setProductForm({ ...productForm, imageUrls: urls })}
                  maxImages={5}
                  folder="products"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddProductDialog(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file with columns: name, sku, barcode, category, brand, hsnCode, gstRate, mrp, costPrice, sellingPrice, reorderLevel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="csv-upload">CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setCsvFile(file)
                  // Parse preview
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string
                    const lines = text.split('\n').filter(l => l.trim())
                    if (lines.length < 2) return
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
                    const previewRows: CSVRow[] = lines.slice(1, 6).map(line => {
                      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
                      const row: Record<string, string> = {}
                      headers.forEach((h, i) => { row[h.toLowerCase()] = vals[i] || '' })
                      return row as unknown as CSVRow
                    })
                    setCsvPreview(previewRows)
                  }
                  reader.readAsText(file)
                }}
              />
            </div>
            {csvPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Preview (first 5 rows)</Label>
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Selling Price</TableHead>
                        <TableHead>GST%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreview.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell className="font-mono text-xs">{row.sku || '-'}</TableCell>
                          <TableCell>{row.category || '-'}</TableCell>
                          <TableCell>{row.sellingPrice || '-'}</TableCell>
                          <TableCell>{row.gstRate || '18'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-col">
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setCsvFile(null); setCsvPreview([]) }}>
              Cancel
            </Button>
            <Button
              disabled={!csvFile || isImporting}
              onClick={async () => {
                if (!csvFile) return
                setIsImporting(true)
                try {
                  const reader = new FileReader()
                  reader.onload = async (ev) => {
                    const text = ev.target?.result as string
                    const lines = text.split('\n').filter(l => l.trim())
                    if (lines.length < 2) { toast.error('Invalid CSV'); setIsImporting(false); return }
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
                    const rows: CSVRow[] = lines.slice(1).map(line => {
                      const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
                      const row: Record<string, string> = {}
                      headers.forEach((h, i) => { row[h.toLowerCase()] = vals[i] || '' })
                      return row as unknown as CSVRow
                    })
                    const res = await fetch('/api/products/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rows }),
                    })
                    const data = await res.json()
                    if (res.ok) {
                      toast.success(data.message || 'Import complete')
                      queryClient.invalidateQueries({ queryKey: ['products'] })
                      setShowImportDialog(false)
                      setCsvFile(null)
                      setCsvPreview([])
                    } else {
                      toast.error(data.error || 'Import failed')
                    }
                  }
                  reader.readAsText(csvFile)
                } catch {
                  toast.error('Import failed')
                } finally {
                  setIsImporting(false)
                }
              }}
            >
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isImporting ? 'Importing...' : 'Import CSV'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={showProductDetail} onOpenChange={setShowProductDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.product?.name}</DialogTitle>
            <DialogDescription>
              Product Code: {selectedProduct?.product?.sku} • Store: {selectedProduct?.store?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-2">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="text-2xl font-bold">{selectedProduct.quantity}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Min Stock</p>
                    <p className="text-2xl font-bold">
                      {selectedProduct.product?.reorderLevel || '-'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Stock Value</p>
                    <p className="text-2xl font-bold">
                      ₹{((selectedProduct.quantity || 0) * Number(selectedProduct.product?.costPrice || 0)).toLocaleString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Stock Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Batch Number:</span>{' '}
                    {selectedProduct.batchNumber || 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expiry Date:</span>{' '}
                    {selectedProduct.expiryDate
                      ? new Date(selectedProduct.expiryDate).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Updated:</span>{' '}
                    {selectedProduct.lastStockUpdate
                      ? new Date(selectedProduct.lastStockUpdate).toLocaleDateString('en-IN')
                      : 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    {selectedProduct.location?.name || 'Default'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Product Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">MRP:</span>{' '}
                    ₹{Number(selectedProduct.product?.mrp || 0).toLocaleString('en-IN')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost Price:</span>{' '}
                    ₹{Number(selectedProduct.product?.costPrice || 0).toLocaleString('en-IN')}
                  </div>
                  <div>
                    <span className="text-muted-foreground">GST Rate:</span>{' '}
                    {Number(selectedProduct.product?.gstRate || 18)}%
                  </div>
                  <div>
                    <span className="text-muted-foreground">Product Type:</span>{' '}
                    {selectedProduct.product?.productType}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
