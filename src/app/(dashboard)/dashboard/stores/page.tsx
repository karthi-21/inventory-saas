'use client'

import { useState } from 'react'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Store,
  Plus,
  Search,
  MapPin,
  Phone,
  Edit,
  Trash2,
  Loader2,
  Building2,
  AlertCircle,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Warehouse,
  Monitor,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Store as StoreType, StoreType as StoreTypeEnum, Location } from '@/types'

interface StoreWithLocations extends StoreType {
  locations?: Location[]
}

const storeTypeLabels: Record<string, string> = {
  ELECTRONICS: 'Electronics',
  CLOTHING: 'Clothing',
  GROCERY: 'Grocery',
  SUPERMARKET: 'Supermarket',
  WHOLESALE: 'Wholesale',
  RESTAURANT: 'Restaurant',
  MULTI_CATEGORY: 'Multi-Category',
}

export default function StoresPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreWithLocations | null>(null)
  const [activeTab, setActiveTab] = useState('active')

  // Location management state
  const [locationName, setLocationName] = useState('')
  const [locationType, setLocationType] = useState('COUNTER')
  const [locations, setLocations] = useState<Array<{ id: string; name: string; type: string }>>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  const locationTypeLabels: Record<string, string> = {
    COUNTER: 'Counter',
    WAREHOUSE: 'Warehouse',
    SHOWROOM: 'Showroom',
    COLD_STORAGE: 'Cold Storage',
    KITCHEN: 'Kitchen',
    RACK: 'Rack',
  }

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    storeType: 'ELECTRONICS' as StoreTypeEnum,
    address: '',
    state: '',
    pincode: '',
    phone: '',
  })

  const queryClient = useQueryClient()

  // Fetch stores
  const { data: stores, isLoading, error } = useQuery<StoreWithLocations[]>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      const json = await res.json()
      return json.data || []
    },
  })

  // Create store mutation
  const createStore = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create store')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Store created successfully')
      setShowAddDialog(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Update store mutation
  const updateStore = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update store')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Store updated successfully')
      setShowEditDialog(false)
      setSelectedStore(null)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Archive store mutation
  const archiveStore = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      if (!res.ok) throw new Error('Failed to archive store')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Store archived successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Restore store mutation
  const restoreStore = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/stores/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      if (!res.ok) throw new Error('Failed to restore store')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Store restored successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Fetch locations for a store
  const fetchLocations = async (storeId: string) => {
    setIsLoadingLocations(true)
    try {
      const res = await fetch(`/api/locations?storeId=${storeId}`)
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

  // Create location mutation
  const createLocation = useMutation({
    mutationFn: async (data: { storeId: string; name: string; type: string }) => {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create location')
      }
      return res.json()
    },
    onSuccess: () => {
      if (selectedStore) fetchLocations(selectedStore.id)
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Location added successfully')
      setLocationName('')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  // Delete location mutation
  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete location')
      }
      return res.json()
    },
    onSuccess: () => {
      if (selectedStore) fetchLocations(selectedStore.id)
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      toast.success('Location removed')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      storeType: 'ELECTRONICS',
      address: '',
      state: '',
      pincode: '',
      phone: '',
    })
  }

  const handleEdit = (store: StoreWithLocations) => {
    setSelectedStore(store)
    setFormData({
      name: store.name,
      code: store.code,
      storeType: store.storeType,
      address: store.address || '',
      state: store.state || '',
      pincode: store.pincode || '',
      phone: store.phone || '',
    })
    fetchLocations(store.id)
    setShowEditDialog(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required')
      return
    }
    createStore.mutate(formData)
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStore) return
    updateStore.mutate({ id: selectedStore.id, data: formData })
  }

  const filteredStores = stores?.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'active' && store.isActive) ||
      (activeTab === 'archived' && !store.isActive)
    return matchesSearch && matchesTab
  }) || []

  const activeStoresCount = stores?.filter(s => s.isActive).length || 0
  const archivedStoresCount = stores?.filter(s => !s.isActive).length || 0

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
        <p className="text-muted-foreground">Failed to load stores</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['stores'] })}>
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
          <h1 className="text-2xl font-bold tracking-tight">Stores</h1>
          <p className="text-sm text-muted-foreground">Manage your storefronts and inventory locations</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Stores</p>
              <p className="text-2xl font-bold">{stores?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Building2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{activeStoresCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Archived</p>
              <p className="text-2xl font-bold">{archivedStoresCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Store Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStores.map((store) => (
          <Card key={store.id} className={`hover:shadow-md transition-shadow ${!store.isActive ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{store.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{store.code}</p>
                  </div>
                </div>
                <Badge variant={store.isActive ? 'default' : 'secondary'}>
                  {store.isActive ? 'Active' : 'Archived'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                {store.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{store.address}</span>
                  </div>
                )}
                {store.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{store.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {storeTypeLabels[store.storeType] || store.storeType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {store.locations?.length || 0} location{store.locations?.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                {/* Location chips */}
                {store.locations && store.locations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {store.locations.map((loc) => (
                      <Badge key={loc.id} variant="secondary" className="text-xs gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {loc.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleEdit(store)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {store.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-red-600 hover:text-red-600"
                    onClick={() => archiveStore.mutate(store.id)}
                    disabled={archiveStore.isPending}
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archive
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-green-600 hover:text-green-600"
                    onClick={() => restoreStore.mutate(store.id)}
                    disabled={restoreStore.isPending}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStores.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Store className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">No stores found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Add your first store to get started'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowAddDialog(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Store
            </Button>
          )}
        </div>
      )}

      {/* Add Store Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Store</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Chennai Showroom"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Store Code *</Label>
                  <Input
                    id="code"
                    placeholder="STR-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Store Type</Label>
                  <Select
                    value={formData.storeType}
                    onValueChange={(v) => setFormData({ ...formData, storeType: v as StoreTypeEnum })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(storeTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 MG Road, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="Tamil Nadu"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN Code</Label>
                  <Input
                    id="pincode"
                    placeholder="600001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  placeholder="33AAACH0000P1Z5"
                  className="uppercase"
                  value={(formData as Record<string, string>).gstin || ''}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value } as typeof formData)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={createStore.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createStore.isPending}>
                {createStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Store
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Store Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Store Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g. Chennai Showroom"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Store Code *</Label>
                  <Input
                    id="edit-code"
                    placeholder="STR-001"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Store Type</Label>
                  <Select
                    value={formData.storeType}
                    onValueChange={(v) => setFormData({ ...formData, storeType: v as StoreTypeEnum })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(storeTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  placeholder="123 MG Road, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-state">State</Label>
                  <Input
                    id="edit-state"
                    placeholder="Tamil Nadu"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pincode">PIN Code</Label>
                  <Input
                    id="edit-pincode"
                    placeholder="600001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gstin">GSTIN</Label>
                <Input
                  id="edit-gstin"
                  placeholder="33AAACH0000P1Z5"
                  className="uppercase"
                  value={(formData as Record<string, string>).gstin || ''}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value } as typeof formData)}
                />
              </div>

              {/* Locations Management */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Locations</Label>
                  <Badge variant="outline">{locations.length}</Badge>
                </div>

                {/* Existing locations list */}
                {isLoadingLocations ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : locations.length > 0 ? (
                  <div className="space-y-2">
                    {locations.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="flex items-center gap-2">
                          {loc.type === 'COUNTER' ? <Monitor className="h-4 w-4 text-muted-foreground" /> :
                           loc.type === 'WAREHOUSE' ? <Warehouse className="h-4 w-4 text-muted-foreground" /> :
                           <MapPin className="h-4 w-4 text-muted-foreground" />}
                          <span className="text-sm">{loc.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {locationTypeLabels[loc.type] || loc.type}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteLocation.mutate(loc.id)}
                          disabled={deleteLocation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No locations added yet</p>
                )}

                {/* Add location form */}
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Location name"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && locationName.trim() && selectedStore) {
                          createLocation.mutate({ storeId: selectedStore.id, name: locationName.trim(), type: locationType })
                        }
                      }}
                    />
                  </div>
                  <Select value={locationType} onValueChange={(v) => setLocationType(v ?? 'COUNTER')}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(locationTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="gap-1"
                    disabled={!locationName.trim() || !selectedStore || createLocation.isPending}
                    onClick={() => {
                      if (selectedStore && locationName.trim()) {
                        createLocation.mutate({ storeId: selectedStore.id, name: locationName.trim(), type: locationType })
                      }
                    }}
                  >
                    {createLocation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={updateStore.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateStore.isPending}>
                {updateStore.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Store
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
