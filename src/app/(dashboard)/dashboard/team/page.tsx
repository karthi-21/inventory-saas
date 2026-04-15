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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Users,
  Plus,
  Search,
  Shield,
  Loader2,
  Pencil,
  Trash2,
  Mail,
  UserCog,
} from 'lucide-react'
import { toast } from 'sonner'

// --- Types ---

interface StoreOption {
  id: string
  name: string
  code: string
}

interface PersonaOption {
  id: string
  name: string
  description?: string | null
  isSystem: boolean
}

interface UserStoreAccess {
  id: string
  storeId: string
  isDefault: boolean
  store: { id: string; name: string }
}

interface UserPersona {
  id: string
  personaId: string
  persona: { id: string; name: string }
}

interface TeamUser {
  id: string
  email: string | null
  phone: string | null
  firstName: string
  lastName: string | null
  isOwner: boolean
  isActive: boolean
  storeAccess: UserStoreAccess[]
  userPersonas: UserPersona[]
}

interface PersonaPermission {
  id: string
  module: string
  action: string
}

interface PersonaWithPerms extends PersonaOption {
  permissions: PersonaPermission[]
  _count?: { userPersonas: number }
}

interface UsersResponse {
  data: TeamUser[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

interface PersonasResponse {
  data: PersonaWithPerms[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
}

// --- Permission module groups for display ---

const PERMISSION_GROUPS: { label: string; modules: { value: string; label: string; actions: string[] }[] }[] = [
  {
    label: 'Store',
    modules: [
      { value: 'STORE_VIEW', label: 'Store', actions: ['VIEW'] },
      { value: 'STORE_EDIT', label: 'Store', actions: ['EDIT'] },
    ],
  },
  {
    label: 'Users',
    modules: [
      { value: 'USER_VIEW', label: 'Users', actions: ['VIEW'] },
      { value: 'USER_CREATE', label: 'Users', actions: ['CREATE'] },
      { value: 'USER_EDIT', label: 'Users', actions: ['EDIT'] },
      { value: 'USER_DELETE', label: 'Users', actions: ['DELETE'] },
    ],
  },
  {
    label: 'Products',
    modules: [
      { value: 'PRODUCT_VIEW', label: 'Products', actions: ['VIEW'] },
      { value: 'PRODUCT_CREATE', label: 'Products', actions: ['CREATE'] },
      { value: 'PRODUCT_EDIT', label: 'Products', actions: ['EDIT'] },
      { value: 'PRODUCT_DELETE', label: 'Products', actions: ['DELETE'] },
    ],
  },
  {
    label: 'Inventory',
    modules: [
      { value: 'INVENTORY_VIEW', label: 'Inventory', actions: ['VIEW'] },
      { value: 'INVENTORY_EDIT', label: 'Inventory', actions: ['EDIT'] },
      { value: 'INVENTORY_ADJUST', label: 'Inventory', actions: ['ADJUST'] },
    ],
  },
  {
    label: 'Billing',
    modules: [
      { value: 'BILLING_VIEW', label: 'Billing', actions: ['VIEW'] },
      { value: 'BILLING_CREATE', label: 'Billing', actions: ['CREATE'] },
      { value: 'BILLING_EDIT', label: 'Billing', actions: ['EDIT'] },
      { value: 'BILLING_DELETE', label: 'Billing', actions: ['DELETE'] },
      { value: 'BILLING_RETURN', label: 'Billing', actions: ['ADJUST'] },
      { value: 'PRICE_OVERRIDE', label: 'Price Override', actions: ['EDIT'] },
      { value: 'DISCOUNT_GLOBAL', label: 'Discount', actions: ['EDIT'] },
    ],
  },
  {
    label: 'Purchases',
    modules: [
      { value: 'PURCHASE_VIEW', label: 'Purchases', actions: ['VIEW'] },
      { value: 'PURCHASE_CREATE', label: 'Purchases', actions: ['CREATE'] },
      { value: 'PURCHASE_EDIT', label: 'Purchases', actions: ['EDIT'] },
    ],
  },
  {
    label: 'Customers',
    modules: [
      { value: 'CUSTOMER_VIEW', label: 'Customers', actions: ['VIEW'] },
      { value: 'CUSTOMER_CREATE', label: 'Customers', actions: ['CREATE'] },
      { value: 'CUSTOMER_EDIT', label: 'Customers', actions: ['EDIT'] },
      { value: 'CUSTOMER_DELETE', label: 'Customers', actions: ['DELETE'] },
    ],
  },
  {
    label: 'Vendors',
    modules: [
      { value: 'VENDOR_VIEW', label: 'Vendors', actions: ['VIEW'] },
      { value: 'VENDOR_CREATE', label: 'Vendors', actions: ['CREATE'] },
      { value: 'VENDOR_EDIT', label: 'Vendors', actions: ['EDIT'] },
      { value: 'VENDOR_DELETE', label: 'Vendors', actions: ['DELETE'] },
    ],
  },
  {
    label: 'Reports',
    modules: [
      { value: 'REPORT_VIEW', label: 'Reports', actions: ['VIEW'] },
      { value: 'REPORT_EXPORT', label: 'Reports', actions: ['VIEW'] },
    ],
  },
  {
    label: 'Settings',
    modules: [
      { value: 'SETTINGS_VIEW', label: 'Settings', actions: ['VIEW'] },
      { value: 'SETTINGS_EDIT', label: 'Settings', actions: ['EDIT'] },
    ],
  },
  {
    label: 'Restaurant',
    modules: [
      { value: 'TABLE_MANAGE', label: 'Tables', actions: ['EDIT'] },
      { value: 'KOT_VIEW', label: 'KOT', actions: ['VIEW'] },
      { value: 'KOT_EDIT', label: 'KOT', actions: ['EDIT'] },
      { value: 'BOM_VIEW', label: 'BOM', actions: ['VIEW'] },
      { value: 'BOM_EDIT', label: 'BOM', actions: ['EDIT'] },
    ],
  },
]

// Deduplicated modules for the permission editor grid
const PERM_MODULES = [
  { group: 'Store', items: ['STORE_VIEW', 'STORE_EDIT'] },
  { group: 'Users', items: ['USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE'] },
  { group: 'Products', items: ['PRODUCT_VIEW', 'PRODUCT_CREATE', 'PRODUCT_EDIT', 'PRODUCT_DELETE'] },
  { group: 'Inventory', items: ['INVENTORY_VIEW', 'INVENTORY_EDIT', 'INVENTORY_ADJUST'] },
  { group: 'Billing', items: ['BILLING_VIEW', 'BILLING_CREATE', 'BILLING_EDIT', 'BILLING_DELETE', 'BILLING_RETURN', 'PRICE_OVERRIDE', 'DISCOUNT_GLOBAL'] },
  { group: 'Purchases', items: ['PURCHASE_VIEW', 'PURCHASE_CREATE', 'PURCHASE_EDIT'] },
  { group: 'Customers', items: ['CUSTOMER_VIEW', 'CUSTOMER_CREATE', 'CUSTOMER_EDIT', 'CUSTOMER_DELETE'] },
  { group: 'Vendors', items: ['VENDOR_VIEW', 'VENDOR_CREATE', 'VENDOR_EDIT', 'VENDOR_DELETE'] },
  { group: 'Reports', items: ['REPORT_VIEW', 'REPORT_EXPORT'] },
  { group: 'Settings', items: ['SETTINGS_VIEW', 'SETTINGS_EDIT'] },
  { group: 'Restaurant', items: ['TABLE_MANAGE', 'KOT_VIEW', 'KOT_EDIT', 'BOM_VIEW', 'BOM_EDIT'] },
]

const ALL_ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'ADJUST']

function moduleLabel(mod: string): string {
  return mod.replace(/_/g, ' ').replace(/^\w+ /, '')
}

function actionLabel(action: string): string {
  return action.charAt(0) + action.slice(1).toLowerCase()
}

// --- Component ---

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('members')

  // Dialogs
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showEditUserDialog, setShowEditUserDialog] = useState(false)
  const [showEditPermsDialog, setShowEditPermsDialog] = useState(false)
  const [showCreateRoleDialog, setShowCreateRoleDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<PersonaWithPerms | null>(null)

  // Form state
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', personaId: '', storeIds: [] as string[] })
  const [editUserForm, setEditUserForm] = useState({ personaId: '', storeIds: [] as string[] })
  const [roleForm, setRoleForm] = useState({ name: '', description: '' })
  const [permSet, setPermSet] = useState<Set<string>>(new Set())

  // --- Queries ---

  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery<UsersResponse>({
    queryKey: ['users', searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      params.set('includeInactive', 'true')
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const { data: personasData, isLoading: personasLoading } = useQuery<PersonasResponse>({
    queryKey: ['personas'],
    queryFn: async () => {
      const res = await fetch('/api/personas')
      if (!res.ok) throw new Error('Failed to fetch personas')
      return res.json()
    },
  })

  const { data: storesData } = useQuery<StoreOption[]>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) return []
      const json = await res.json()
      return json.data || []
    },
  })

  const users = usersData?.data || []
  const personas = personasData?.data || []
  const stores = storesData || []

  // --- Mutations ---

  const inviteUser = useMutation({
    mutationFn: async (data: typeof inviteForm) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to invite user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Team member invited')
      setShowInviteDialog(false)
      setInviteForm({ email: '', firstName: '', lastName: '', personaId: '', storeIds: [] })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to invite user')
    },
  })

  const updateUser = useMutation({
    mutationFn: async (data: { id: string; personaId: string; storeIds: string[] }) => {
      const res = await fetch(`/api/users/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaId: data.personaId, storeIds: data.storeIds }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated')
      setShowEditUserDialog(false)
      setSelectedUser(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    },
  })

  const deactivateUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to remove user')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User removed')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove user')
    },
  })

  const createPersona = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: { module: string; action: string }[] }) => {
      const res = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      toast.success('Role created')
      setShowCreateRoleDialog(false)
      setRoleForm({ name: '', description: '' })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create role')
    },
  })

  const updatePersona = useMutation({
    mutationFn: async (data: { id: string; permissions: { module: string; action: string }[] }) => {
      const res = await fetch(`/api/personas/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: data.permissions }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update permissions')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      toast.success('Permissions updated')
      setShowEditPermsDialog(false)
      setSelectedPersona(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update permissions')
    },
  })

  const deletePersona = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/personas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] })
      toast.success('Role deleted')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete role')
    },
  })

  // --- Handlers ---

  const handleInvite = () => {
    if (!inviteForm.email.trim() || !inviteForm.firstName.trim()) {
      toast.error('Email and first name are required')
      return
    }
    inviteUser.mutate(inviteForm)
  }

  const handleEditUser = (user: TeamUser) => {
    setSelectedUser(user)
    setEditUserForm({
      personaId: user.userPersonas[0]?.personaId || '',
      storeIds: user.storeAccess.map((sa) => sa.storeId),
    })
    setShowEditUserDialog(true)
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return
    updateUser.mutate({ id: selectedUser.id, ...editUserForm })
  }

  const handleEditPerms = (persona: PersonaWithPerms) => {
    setSelectedPersona(persona)
    const keys = persona.permissions.map((p) => `${p.module}:${p.action}`)
    setPermSet(new Set(keys))
    setShowEditPermsDialog(true)
  }

  const handleSavePerms = () => {
    if (!selectedPersona) return
    const permissions = Array.from(permSet).map((key) => {
      const [module, action] = key.split(':')
      return { module, action }
    })
    updatePersona.mutate({ id: selectedPersona.id, permissions })
  }

  const handleCreateRole = () => {
    if (!roleForm.name.trim()) {
      toast.error('Role name is required')
      return
    }
    const permissions = Array.from(permSet).map((key) => {
      const [module, action] = key.split(':')
      return { module, action }
    })
    createPersona.mutate({ ...roleForm, permissions })
  }

  const togglePerm = (module: string, action: string) => {
    const key = `${module}:${action}`
    setPermSet((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleStoreAccess = (storeId: string, formType: 'invite' | 'editUser') => {
    if (formType === 'invite') {
      setInviteForm((prev) => ({
        ...prev,
        storeIds: prev.storeIds.includes(storeId)
          ? prev.storeIds.filter((id) => id !== storeId)
          : [...prev.storeIds, storeId],
      }))
    } else {
      setEditUserForm((prev) => ({
        ...prev,
        storeIds: prev.storeIds.includes(storeId)
          ? prev.storeIds.filter((id) => id !== storeId)
          : [...prev.storeIds, storeId],
      }))
    }
  }

  // --- Render ---

  if (usersError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">Failed to load team data</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">Manage members, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'members' && (
            <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Invite Member
            </Button>
          )}
          {activeTab === 'roles' && (
            <Button onClick={() => { setRoleForm({ name: '', description: '' }); setPermSet(new Set()); setShowCreateRoleDialog(true) }} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-2xl font-bold">{usersData?.pagination.total || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{users.filter((u) => u.isActive).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Roles</p>
              <p className="text-2xl font-bold">{personasData?.pagination.total || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No team members yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Invite your first team member</p>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Invite Member
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Store Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.firstName} {user.lastName || ''}
                            {user.isOwner && (
                              <Badge variant="outline" className="text-xs">Owner</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email || '-'}
                        </TableCell>
                        <TableCell>
                          {user.isOwner ? (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Owner</Badge>
                          ) : user.userPersonas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.userPersonas.map((up) => (
                                <Badge key={up.id} variant="outline">{up.persona.name}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No role</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.storeAccess.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.storeAccess.map((sa) => (
                                <Badge key={sa.id} variant="secondary" className="text-xs">
                                  {sa.store.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No access</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!user.isOwner && (
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} title="Edit role">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                if (confirm('Remove this team member?')) deactivateUser.mutate(user.id)
                              }} title="Remove member">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="p-0">
              {personasLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : personas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No roles defined</p>
                  <p className="text-sm text-muted-foreground mb-4">Create your first custom role</p>
                  <Button onClick={() => { setRoleForm({ name: '', description: '' }); setPermSet(new Set()); setShowCreateRoleDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" /> Create Role
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Permissions</TableHead>
                      <TableHead className="text-center">Assigned Users</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personas.map((persona) => (
                      <TableRow key={persona.id}>
                        <TableCell className="font-medium">{persona.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {persona.description || '-'}
                        </TableCell>
                        <TableCell>
                          {persona.isSystem ? (
                            <Badge variant="outline">System</Badge>
                          ) : (
                            <Badge variant="secondary">Custom</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{persona.permissions.length}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{persona._count?.userPersonas || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPerms(persona)} title="Edit permissions">
                              <UserCog className="h-4 w-4" />
                            </Button>
                            {!persona.isSystem && (
                              <Button variant="ghost" size="sm" onClick={() => {
                                if (confirm('Delete this role?')) deletePersona.mutate(persona.id)
                              }} title="Delete role">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- Invite Member Dialog --- */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Add a new member to your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  placeholder="First name"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Last name"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={inviteForm.personaId}
                onValueChange={(v) => setInviteForm({ ...inviteForm, personaId: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {stores.length > 0 && (
              <div className="space-y-2">
                <Label>Store Access</Label>
                <div className="space-y-2 border rounded-md p-3">
                  {stores.map((store) => (
                    <label key={store.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inviteForm.storeIds.includes(store.id)}
                        onChange={() => toggleStoreAccess(store.id, 'invite')}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {store.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteUser.isPending} className="gap-2">
              {inviteUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Mail className="h-4 w-4" />
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Edit User Dialog --- */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>Update role and store access for {selectedUser?.firstName} {selectedUser?.lastName ?? ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={editUserForm.personaId}
                onValueChange={(v) => setEditUserForm({ ...editUserForm, personaId: v ?? '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {stores.length > 0 && (
              <div className="space-y-2">
                <Label>Store Access</Label>
                <div className="space-y-2 border rounded-md p-3">
                  {stores.map((store) => (
                    <label key={store.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editUserForm.storeIds.includes(store.id)}
                        onChange={() => toggleStoreAccess(store.id, 'editUser')}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      {store.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={updateUser.isPending} className="gap-2">
              {updateUser.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Create Role Dialog --- */}
      <Dialog open={showCreateRoleDialog} onOpenChange={setShowCreateRoleDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
            <DialogDescription>Define a new role with specific permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name *</Label>
                <Input
                  placeholder="e.g. Billing Operator"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  placeholder="Brief description"
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-medium">Module</th>
                      {ALL_ACTIONS.map((action) => (
                        <th key={action} className="text-center px-2 py-2 font-medium">{actionLabel(action)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERM_MODULES.map((group) =>
                      group.items.map((mod) => (
                        <tr key={mod} className="border-b last:border-b-0">
                          <td className="px-3 py-1.5 font-medium text-muted-foreground">{moduleLabel(mod)}</td>
                          {ALL_ACTIONS.map((action) => {
                            const key = `${mod}:${action}`
                            const applicable = isModuleActionApplicable(mod, action)
                            return (
                              <td key={key} className="text-center px-2 py-1.5">
                                {applicable ? (
                                  <input
                                    type="checkbox"
                                    checked={permSet.has(key)}
                                    onChange={() => togglePerm(mod, action)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                ) : (
                                  <span className="text-muted-foreground/30">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} disabled={createPersona.isPending} className="gap-2">
              {createPersona.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Edit Permissions Dialog --- */}
      <Dialog open={showEditPermsDialog} onOpenChange={setShowEditPermsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions: {selectedPersona?.name ?? 'Role'}</DialogTitle>
            <DialogDescription>Configure which actions this role can perform</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b">
                    <th className="text-left px-3 py-2 font-medium">Module</th>
                    {ALL_ACTIONS.map((action) => (
                      <th key={action} className="text-center px-2 py-2 font-medium">{actionLabel(action)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PERM_MODULES.map((group) =>
                    group.items.map((mod) => (
                      <tr key={mod} className="border-b last:border-b-0">
                        <td className="px-3 py-1.5 font-medium text-muted-foreground">{moduleLabel(mod)}</td>
                        {ALL_ACTIONS.map((action) => {
                          const key = `${mod}:${action}`
                          const applicable = isModuleActionApplicable(mod, action)
                          return (
                            <td key={key} className="text-center px-2 py-1.5">
                              {applicable ? (
                                <input
                                  type="checkbox"
                                  checked={permSet.has(key)}
                                  onChange={() => togglePerm(mod, action)}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                              ) : (
                                <span className="text-muted-foreground/30">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPermsDialog(false)}>Cancel</Button>
            <Button onClick={handleSavePerms} disabled={updatePersona.isPending} className="gap-2">
              {updatePersona.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Determine if a module+action combination is valid based on the Prisma schema.
 * Some modules only support certain actions (e.g. BILLING_RETURN only has ADJUST).
 */
function isModuleActionApplicable(module: string, action: string): boolean {
  const MODULE_ACTIONS: Record<string, string[]> = {
    STORE_VIEW: ['VIEW'],
    STORE_EDIT: ['EDIT'],
    USER_VIEW: ['VIEW'],
    USER_CREATE: ['CREATE'],
    USER_EDIT: ['EDIT'],
    USER_DELETE: ['DELETE'],
    PRODUCT_VIEW: ['VIEW'],
    PRODUCT_CREATE: ['CREATE'],
    PRODUCT_EDIT: ['EDIT'],
    PRODUCT_DELETE: ['DELETE'],
    INVENTORY_VIEW: ['VIEW'],
    INVENTORY_EDIT: ['EDIT'],
    INVENTORY_ADJUST: ['ADJUST'],
    BILLING_VIEW: ['VIEW'],
    BILLING_CREATE: ['CREATE'],
    BILLING_EDIT: ['EDIT'],
    BILLING_DELETE: ['DELETE'],
    BILLING_RETURN: ['ADJUST'],
    PURCHASE_VIEW: ['VIEW'],
    PURCHASE_CREATE: ['CREATE'],
    PURCHASE_EDIT: ['EDIT'],
    CUSTOMER_VIEW: ['VIEW'],
    CUSTOMER_CREATE: ['CREATE'],
    CUSTOMER_EDIT: ['EDIT'],
    CUSTOMER_DELETE: ['DELETE'],
    VENDOR_VIEW: ['VIEW'],
    VENDOR_CREATE: ['CREATE'],
    VENDOR_EDIT: ['EDIT'],
    VENDOR_DELETE: ['DELETE'],
    REPORT_VIEW: ['VIEW'],
    REPORT_EXPORT: ['VIEW'],
    SETTINGS_VIEW: ['VIEW'],
    SETTINGS_EDIT: ['EDIT'],
    TABLE_MANAGE: ['EDIT'],
    KOT_VIEW: ['VIEW'],
    KOT_EDIT: ['EDIT'],
    BOM_VIEW: ['VIEW'],
    BOM_EDIT: ['EDIT'],
    PRICE_OVERRIDE: ['EDIT'],
    DISCOUNT_GLOBAL: ['EDIT'],
  }
  return MODULE_ACTIONS[module]?.includes(action) ?? false
}