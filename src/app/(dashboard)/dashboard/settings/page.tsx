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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Store,
  Receipt,
  Bell,
  Users,
  Shield,
  Save,
  Loader2,
  Award,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

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

  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [loyaltyForm, setLoyaltyForm] = useState({
    loyaltyEnabled: true,
    pointsPerRupee: '1',
    rupeePerPoint: '0.25',
    minimumRedemption: '100',
    pointsExpiryDays: '365',
  })

  // Fetch loyalty settings
  const { data: loyaltyData } = useQuery({
    queryKey: ['loyalty-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings/loyalty')
      if (!res.ok) throw new Error('Failed to fetch loyalty settings')
      return res.json()
    },
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

  useEffect(() => {
    if (loyaltyData) {
      setLoyaltyForm({
        loyaltyEnabled: loyaltyData.loyaltyEnabled ?? true,
        pointsPerRupee: String(loyaltyData.pointsPerRupee ?? 1),
        rupeePerPoint: String(loyaltyData.rupeePerPoint ?? 0.25),
        minimumRedemption: String(loyaltyData.minimumRedemption ?? 100),
        pointsExpiryDays: String(loyaltyData.pointsExpiryDays ?? 365),
      })
    }
  }, [loyaltyData])

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

  // Update loyalty mutation
  const updateLoyalty = useMutation({
    mutationFn: async (data: typeof loyaltyForm) => {
      const res = await fetch('/api/settings/loyalty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyaltyEnabled: data.loyaltyEnabled,
          pointsPerRupee: parseFloat(data.pointsPerRupee),
          rupeePerPoint: parseFloat(data.rupeePerPoint),
          minimumRedemption: parseInt(data.minimumRedemption),
          pointsExpiryDays: parseInt(data.pointsExpiryDays),
        }),
      })
      if (!res.ok) throw new Error('Failed to update loyalty settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] })
      toast.success('Loyalty settings updated')
    },
    onError: () => toast.error('Failed to update loyalty settings'),
  })

  const handleSaveLoyalty = () => updateLoyalty.mutate(loyaltyForm)

  const handleChangePassword = async () => {
    if (!passwordForm.newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })
      if (error) {
        toast.error(error.message || 'Failed to change password')
      } else {
        toast.success('Password changed successfully')
        setPasswordDialogOpen(false)
        setPasswordForm({ newPassword: '', confirmPassword: '' })
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsChangingPassword(false)
    }
  }

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
              <Label>GST Number (GSTIN)</Label>
              <p className="text-xs text-muted-foreground">Your 15-digit tax identification number</p>
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
              <Label>PAN (Tax ID)</Label>
              <p className="text-xs text-muted-foreground">10-character tax ID for income tax filing</p>
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
            <CardTitle>Bill Settings</CardTitle>
          </div>
          <CardDescription>Configure bill numbering and display</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Bill Prefix</Label>
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
              <p className="text-xs text-muted-foreground">Number of decimal places in prices (2 = ₹1.00)</p>
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
            Save Bill Settings
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
              <p className="text-xs text-muted-foreground">Alert me this many days before stock runs out</p>
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
              <p className="text-xs text-muted-foreground">Alert me this many days before products expire</p>
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
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/team'}>
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Program */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>Loyalty Program</CardTitle>
          </div>
          <CardDescription>Configure loyalty points earning and redemption</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Loyalty Program</Label>
              <p className="text-xs text-muted-foreground">Allow customers to earn and redeem points</p>
            </div>
            <input
              type="checkbox"
              checked={loyaltyForm.loyaltyEnabled}
              onChange={(e) => setLoyaltyForm({ ...loyaltyForm, loyaltyEnabled: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Points per ₹100 spent</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={loyaltyForm.pointsPerRupee}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, pointsPerRupee: e.target.value })}
                disabled={!loyaltyForm.loyaltyEnabled}
              />
              <p className="text-xs text-muted-foreground">How many points a customer earns for every ₹100 spent</p>
            </div>
            <div className="space-y-2">
              <Label>₹ Value per point</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={loyaltyForm.rupeePerPoint}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, rupeePerPoint: e.target.value })}
                disabled={!loyaltyForm.loyaltyEnabled}
              />
              <p className="text-xs text-muted-foreground">Cash value when customer redeems points</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Minimum redemption points</Label>
              <Input
                type="number"
                min="0"
                value={loyaltyForm.minimumRedemption}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, minimumRedemption: e.target.value })}
                disabled={!loyaltyForm.loyaltyEnabled}
              />
              <p className="text-xs text-muted-foreground">Customer needs at least this many points before they can use them</p>
            </div>
            <div className="space-y-2">
              <Label>Points expiry (days)</Label>
              <Input
                type="number"
                min="0"
                value={loyaltyForm.pointsExpiryDays}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, pointsExpiryDays: e.target.value })}
                disabled={!loyaltyForm.loyaltyEnabled}
              />
              <p className="text-xs text-muted-foreground">Points expire after this many days (0 = never expire)</p>
            </div>
          </div>
          <Button onClick={handleSaveLoyalty} disabled={updateLoyalty.isPending || !loyaltyForm.loyaltyEnabled} className="gap-2">
            {updateLoyalty.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Loyalty Settings
          </Button>
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
            <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>Change</Button>
          </div>

          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your new password below.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter your new password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleChangePassword} disabled={isChangingPassword} className="gap-2">
                  {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  Change Password
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Extra Login Security</p>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Two-factor authentication is coming soon')}>
              Enable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}