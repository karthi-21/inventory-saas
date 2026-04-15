'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
  FolderTree,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Pencil,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description?: string | null
  parentId?: string | null
  parent?: { id: string; name: string } | null
  hsnCode?: string | null
  imageUrl?: string | null
  isActive: boolean
  productCount: number
  childrenCount: number
  children?: Category[]
  createdAt: string
}

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    description: '',
    parentId: '',
    hsnCode: '',
  })

  // Fetch categories
  const { data: categoriesData, isLoading, error } = useQuery<{ data: Category[] }>({
    queryKey: ['categories', 'flat'],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('flat', 'true')
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/categories?${params}`)
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  // Fetch all categories for parent dropdown
  const { data: allCategoriesData } = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      return res.json()
    },
  })

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          parentId: data.parentId || undefined,
          hsnCode: data.hsnCode || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create category')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully')
      setShowAddDialog(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create category')
    },
  })

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: async (data: typeof form & { id: string }) => {
      const res = await fetch(`/api/categories/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          parentId: data.parentId || null,
          hsnCode: data.hsnCode || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update category')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated successfully')
      setShowEditDialog(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    },
  })

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete category')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted successfully')
      setShowDeleteDialog(false)
      setSelectedCategory(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category')
    },
  })

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      parentId: '',
      hsnCode: '',
    })
    setSelectedCategory(null)
  }

  const handleAddCategory = () => {
    if (!form.name.trim()) {
      toast.error('Category name is required')
      return
    }
    createCategory.mutate(form)
  }

  const handleEditCategory = () => {
    if (!selectedCategory || !form.name.trim()) {
      toast.error('Category name is required')
      return
    }
    updateCategory.mutate({ ...form, id: selectedCategory.id })
  }

  const handleDeleteCategory = () => {
    if (!selectedCategory) return
    deleteCategory.mutate(selectedCategory.id)
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setForm({
      name: category.name,
      description: category.description || '',
      parentId: category.parentId || '',
      hsnCode: category.hsnCode || '',
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteDialog(true)
  }

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Build tree from flat list
  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // First pass: create map and initialize children
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree
    categories.forEach(cat => {
      const node = categoryMap.get(cat.id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        rootCategories.push(node)
      }
    })

    return rootCategories
  }

  const categories = categoriesData?.data || []
  const allCategories = allCategoriesData?.data || []
  const categoryTree = buildCategoryTree(categories)

  const renderCategoryRow = (category: Category, depth: number = 0) => {
    const hasChildren = category.childrenCount > 0 || (category.children && category.children.length > 0)
    const isExpanded = expandedCategories.has(category.id)

    return (
      <TableRow key={category.id}>
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren && (
              <button
                onClick={() => toggleExpand(category.id)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
            {!hasChildren && <span className="w-5" />}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500" />
            )}
            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          {category.parent?.name || '-'}
        </TableCell>
        <TableCell>
          {category.hsnCode ? (
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{category.hsnCode}</code>
          ) : (
            '-'
          )}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={category.productCount > 0 ? 'default' : 'secondary'}>
            {category.productCount}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={category.childrenCount > 0 ? 'default' : 'outline'}>
            {category.childrenCount}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant={category.isActive ? 'default' : 'secondary'}>
            {category.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openDeleteDialog(category)}
              disabled={category.productCount > 0 || category.childrenCount > 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  const renderCategoryTree = (categories: Category[], depth: number = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = []

    categories.forEach(category => {
      result.push(renderCategoryRow(category, depth))
      if (expandedCategories.has(category.id) && category.children && category.children.length > 0) {
        result.push(...renderCategoryTree(category.children, depth + 1))
      }
    })

    return result
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">Failed to load categories</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize products into categories and subcategories</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FolderTree className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Folder className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Root Categories</p>
              <p className="text-2xl font-bold">{categoryTree.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sub-categories</p>
              <p className="text-2xl font-bold">{categories.filter(c => c.parentId).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderTree className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No categories yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first category to organize products</p>
              <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead className="text-center">Products</TableHead>
                  <TableHead className="text-center">Sub-categories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderCategoryTree(categoryTree)}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new category for organizing products</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                placeholder="e.g., Electronics"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId || 'none'}
                onValueChange={(v) => v && setForm({ ...form, parentId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root category)</SelectItem>
                  {allCategories
                    .filter((cat) => !cat.parentId)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id!}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input
                placeholder="e.g., 8471"
                value={form.hsnCode}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={createCategory.isPending}>
              {createCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Category</Label>
              <Select
                value={form.parentId || 'none'}
                onValueChange={(v) => v && setForm({ ...form, parentId: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (Root category)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root category)</SelectItem>
                  {allCategories
                    .filter((cat) => cat.id !== selectedCategory?.id && !cat.parentId)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id!}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input
                value={form.hsnCode}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditCategory} disabled={updateCategory.isPending}>
              {updateCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedCategory?.name}&quot;?
              {selectedCategory && (selectedCategory.productCount > 0 || selectedCategory.childrenCount > 0) && (
                <span className="block mt-2 text-destructive">
                  This category cannot be deleted because it has {selectedCategory.productCount} products
                  {selectedCategory.childrenCount > 0 && ` and ${selectedCategory.childrenCount} sub-categories`}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategory.isPending || (selectedCategory ? selectedCategory.productCount > 0 || selectedCategory.childrenCount > 0 : false)}
            >
              {deleteCategory.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}