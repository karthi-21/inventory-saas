'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Store,
  Receipt,
  Bell,
  Users,
  Shield,
  Save,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface TenantSettings {
  id: string
  defaultLanguage: string
  currency: string
  fiscalYearStart: number
  lowStockAlertDays: number
  expiryAlertDays: number
  invoicePrefix: string
  decimalPlaces: number
  roundOffEnabled: boolean
}

interface Tenant {
  id: string
  name: string
  pan?: string | null
  gstin?: string | null
  fssaiNumber?: string | null
  address?: string | null
  state?: string | null
  pincode?: string | null
  phone?: string | null
  email?: string | null
}

export default function SettingsPage() {
  const queryClient = useQueryClient()

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery<{ settings: TenantSettings }>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      return res.json()
    },
  })

  // Fetch tenant info
  const { data: tenantData } = useQuery<{ tenant: Tenant }>({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await fetch('/api/tenant')
      if (!res.ok) throw new Error('Failed to fetch tenant')
      return res.json()
    },
  })

  // Form state
  const [businessForm, setBusinessForm] = useState({
    name: '',
    gstin: '',
    pan: '',
    fssaiNumber: '',
    phone: '',
    email: '',
    address: '',
    state: '',
    pincode: '',
  })

  const [settingsForm, setSettingsForm] = useState({
    invoicePrefix: 'INV',
    defaultLanguage: 'en',
    decimalPlaces: '2',
    roundOffEnabled: true,
    lowStockAlertDays: '7',
    expiryAlertDays: '7',
  })

  // Populate forms when data loads
  useEffect(() => {
    if (tenantData?.tenant) {
      setBusinessForm({
        name: tenantData.tenant.name || '',
        gstin: tenantData.tenant.gstin || '',
        pan: tenantData.tenant.pan || '',
        fssaiNumber: tenantData.tenant.fssaiNumber || '',
        phone: tenantData.tenant.phone || '',
        email: tenantData.tenant.email || '',
        address: tenantData.tenant.address || '',
        state: tenantData.tenant.state || '',
        pincode: tenantData.tenant.pincode || '',
      })
    }
  }, [tenantData])

  useEffect(() => {
    if (settingsData?.settings) {
      setSettingsForm({
        invoicePrefix: settingsData.settings.invoicePrefix || 'INV',
        defaultLanguage: settingsData.settings.defaultLanguage || 'en',
        decimalPlaces: String(settingsData.settings.decimalPlaces || 2),
        roundOffEnabled: settingsData.settings.roundOffEnabled ?? true,
        lowStockAlertDays: String(settingsData.settings.lowStockAlertDays || 7),
        expiryAlertDays: String(settingsData.settings.expiryAlertDays || 7),
      })
    }
  }, [settingsData])

  // Update tenant mutation
  const updateTenant = useMutation({
    mutationFn: async (data: typeof businessForm) => {
      const res = await fetch('/api/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update tenant')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
      toast.success('Business details updated')
    },
    onError: () => toast.error('Failed to update business details'),
  })

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (data: typeof settingsForm) => {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoicePrefix: data.invoicePrefix,
          defaultLanguage: data.defaultLanguage,
          decimalPlaces: parseInt(data.decimalPlaces),
          roundOffEnabled: data.roundOffEnabled,
          lowStockAlertDays: parseInt(data.lowStockAlertDays),
          expiryAlertDays: parseInt(data.expiryAlertDays),
        }),
      })
      if (!res.ok) throw new Error('Failed to update settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated')
    },
    onError: () => toast.error('Failed to update settings'),
  })

  const handleSaveBusiness = () => updateTenant.mutate(businessForm)
  const handleSaveSettings = () => updateSettings.mutate(settingsForm)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your store preferences</p>
      </div>

      {/* Business Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <CardTitle>Business Details</CardTitle>
          </div>
          <CardDescription>Your business information and GST details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input
                value={businessForm.gstin}
                onChange={(e) => setBusinessForm({ ...businessForm, gstin: e.target.value.toUpperCase() })}
                className="uppercase font-mono"
                maxLength={15}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>PAN</Label>
              <Input
                value={businessForm.pan}
                onChange={(e) => setBusinessForm({ ...businessForm, pan: e.target.value.toUpperCase() })}
                className="uppercase font-mono"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>FSSAI (for food businesses)</Label>
              <Input
                value={businessForm.fssaiNumber}
                onChange={(e) => setBusinessForm({ ...businessForm, fssaiNumber: e.target.value })}
                maxLength={14}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={businessForm.phone}
                onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={businessForm.email}
                onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={businessForm.address}
              onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={businessForm.state}
                onChange={(e) => setBusinessForm({ ...businessForm, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>PIN Code</Label>
              <Input
                value={businessForm.pincode}
                onChange={(e) => setBusinessForm({ ...businessForm, pincode: e.target.value.replace(/\D/g, '') })}
                maxLength={6}
              />
            </div>
          </div>
          <Button onClick={handleSaveBusiness} disabled={updateTenant.isPending} className="gap-2">
            {updateTenant.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Business Details
          </Button>
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <CardTitle>Invoice Settings</CardTitle>
          </div>
          <CardDescription>Configure invoice numbering and display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input
                value={settingsForm.invoicePrefix}
                onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Default Language</Label>
              <Select
                value={settingsForm.defaultLanguage}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, defaultLanguage: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ta">Tamil</SelectItem>
                  <SelectItem value="te">Telugu</SelectItem>
                  <SelectItem value="kn">Kannada</SelectItem>
                  <SelectItem value="ml">Malayalam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Decimal Places</Label>
              <Select
                value={settingsForm.decimalPlaces}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, decimalPlaces: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (Whole numbers)</SelectItem>
                  <SelectItem value="2">2 (Standard)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Round Off</Label>
                  <p className="text-xs text-muted-foreground">Round totals to nearest rupee</p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.roundOffEnabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, roundOffEnabled: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="gap-2">
            {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Invoice Settings
          </Button>
        </CardContent>
      </Card>

      {/* Inventory Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Inventory Alerts</CardTitle>
          </div>
          <CardDescription>Configure notification thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Low Stock Alert (days before)</Label>
              <Select
                value={settingsForm.lowStockAlertDays}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, lowStockAlertDays: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Alert (days before)</Label>
              <Select
                value={settingsForm.expiryAlertDays}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, expiryAlertDays: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="gap-2">
            {updateSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Alert Settings
          </Button>
        </CardContent>
      </Card>

      {/* Store & Team */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Store & Team</CardTitle>
          </div>
          <CardDescription>Manage stores, personas, and user access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Stores</p>
              <p className="text-sm text-muted-foreground">Manage store locations</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/stores'}>
              Manage
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Team Members</p>
              <p className="text-sm text-muted-foreground">Manage users and permissions</p>
            </div>
            <Button variant="outline" size="sm">Manage</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Authentication and access controls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}