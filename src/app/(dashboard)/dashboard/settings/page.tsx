'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge' // eslint-disable-line @typescript-eslint/no-unused-vars
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
  Save, // eslint-disable-line @typescript-eslint/no-unused-vars
  Loader2,
  Award,
  Printer,
  CreditCard,
  FileText,
  ChevronRight,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const businessSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').or(z.string().length(0)).optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').or(z.string().length(0)).optional().or(z.literal('')),
  fssaiNumber: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email format').or(z.string().length(0)).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits').or(z.string().length(0)).optional().or(z.literal('')),
})

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const loyaltySchema = z.object({
  loyaltyEnabled: z.boolean(),
  pointsPerRupee: z.string().regex(/^\d+(\.\d+)?$/, 'Enter a valid number'),
  rupeePerPoint: z.string().regex(/^\d+(\.\d+)?$/, 'Enter a valid number'),
  minimumRedemption: z.string().regex(/^\d+$/, 'Enter a whole number'),
  pointsExpiryDays: z.string().regex(/^\d+$/, 'Enter a whole number'),
})

const notifSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
  invoiceAutoSend: z.boolean(),
  lowStockEmailAlerts: z.boolean(),
  shiftSummaryEmail: z.boolean(),
  paymentReminderFrequency: z.string(),
})

type BusinessForm = z.infer<typeof businessSchema>
type PasswordForm = z.infer<typeof passwordSchema>

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
  emailNotificationsEnabled?: boolean
  invoiceAutoSend?: boolean
  lowStockEmailAlerts?: boolean
  shiftSummaryEmail?: boolean
  paymentReminderFrequency?: string
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
  const businessForm = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    mode: 'onChange',
    defaultValues: { name: '', gstin: '', pan: '', fssaiNumber: '', phone: '', email: '', address: '', state: '', pincode: '' },
  })

  const [settingsForm, setSettingsForm] = useState({
    invoicePrefix: 'INV',
    defaultLanguage: 'en',
    decimalPlaces: '2',
    roundOffEnabled: true,
    lowStockAlertDays: '7',
    expiryAlertDays: '7',
  })

  const notifForm = useForm<z.infer<typeof notifSchema>>({
    resolver: zodResolver(notifSchema),
    mode: 'onChange',
    defaultValues: {
      emailNotificationsEnabled: true,
      invoiceAutoSend: true,
      lowStockEmailAlerts: true,
      shiftSummaryEmail: false,
      paymentReminderFrequency: 'WEEKLY',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  })
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [enrolling2FA, setEnrolling2FA] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [twoFASecret, setTwoFASecret] = useState<{ uri: string; secret: string } | null>(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [verifying2FA, setVerifying2FA] = useState(false)

  const loyaltyForm = useForm<z.infer<typeof loyaltySchema>>({
    resolver: zodResolver(loyaltySchema),
    mode: 'onChange',
    defaultValues: {
      loyaltyEnabled: true,
      pointsPerRupee: '1',
      rupeePerPoint: '0.25',
      minimumRedemption: '100',
      pointsExpiryDays: '365',
    },
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
      businessForm.reset({
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
  }, [tenantData, businessForm])

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
      notifForm.reset({
        emailNotificationsEnabled: settingsData.settings.emailNotificationsEnabled ?? true,
        invoiceAutoSend: settingsData.settings.invoiceAutoSend ?? true,
        lowStockEmailAlerts: settingsData.settings.lowStockEmailAlerts ?? true,
        shiftSummaryEmail: settingsData.settings.shiftSummaryEmail ?? false,
        paymentReminderFrequency: settingsData.settings.paymentReminderFrequency || 'WEEKLY',
      })
    }
  }, [settingsData, notifForm])

  useEffect(() => {
    if (loyaltyData) {
      loyaltyForm.reset({
        loyaltyEnabled: loyaltyData.loyaltyEnabled ?? true,
        pointsPerRupee: String(loyaltyData.pointsPerRupee ?? 1),
        rupeePerPoint: String(loyaltyData.rupeePerPoint ?? 0.25),
        minimumRedemption: String(loyaltyData.minimumRedemption ?? 100),
        pointsExpiryDays: String(loyaltyData.pointsExpiryDays ?? 365),
      })
    }
  }, [loyaltyData, loyaltyForm])

  // Update tenant mutation
  const updateTenant = useMutation({
    mutationFn: async (data: BusinessForm) => {
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

  const handleSaveBusiness = async () => {
    const valid = await businessForm.trigger()
    if (!valid) return
    const values = businessForm.getValues()
    updateTenant.mutate(values)
  }
  const handleSaveSettings = () => updateSettings.mutate(settingsForm)

  // Update notification settings mutation
  const updateNotifications = useMutation({
    mutationFn: async (data: z.infer<typeof notifSchema>) => {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update notification settings')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Notification settings updated')
    },
    onError: () => toast.error('Failed to update notification settings'),
  })

  // Update loyalty mutation
  const updateLoyalty = useMutation({
    mutationFn: async (data: z.infer<typeof loyaltySchema>) => {
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

  const handleSaveLoyalty = async () => {
    const valid = await loyaltyForm.trigger()
    if (!valid) return
    updateLoyalty.mutate(loyaltyForm.getValues())
  }

  const handleSaveNotifications = async () => {
    const valid = await notifForm.trigger()
    if (!valid) return
    updateNotifications.mutate(notifForm.getValues())
  }

  const handleChangePassword = async () => {
    const valid = await passwordForm.trigger()
    if (!valid) return
    const values = passwordForm.getValues()

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      })
      if (error) {
        toast.error(error.message || 'Failed to change password')
      } else {
        toast.success('Password changed successfully')
        setPasswordDialogOpen(false)
        passwordForm.reset({ newPassword: '', confirmPassword: '' })
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleEnable2FA = async () => {
    setEnrolling2FA(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Ezvento',
      })
      if (error) {
        toast.error(error.message || 'Failed to start 2FA setup')
        return
      }
      setTwoFASecret({ uri: data.totp.uri, secret: data.totp.secret })
      setShow2FADialog(true)
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setEnrolling2FA(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast.error('Please enter the 6-digit code from your authenticator app')
      return
    }
    setVerifying2FA(true)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: twoFASecret?.secret || '',
      })
      if (challengeError) {
        toast.error(challengeError.message || 'Failed to verify code')
        return
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: challengeData.id,
        challengeId: challengeData.id,
        code: twoFACode,
      })
      if (verifyError) {
        toast.error(verifyError.message || 'Invalid code. Please try again.')
        return
      }
      toast.success('Two-factor authentication enabled successfully!')
      setShow2FADialog(false)
      setTwoFASecret(null)
      setTwoFACode('')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setVerifying2FA(false)
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

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/dashboard/settings/printers" className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Printer className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Receipt Printers</p>
              <p className="text-sm text-muted-foreground">Configure thermal printers</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/dashboard/settings/payment-methods" className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Payment Methods</p>
              <p className="text-sm text-muted-foreground">UPI, cash, card settings</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/dashboard/settings/subscription" className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Award className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Subscription & Billing</p>
              <p className="text-sm text-muted-foreground">Manage your plan</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/dashboard/settings/audit-log" className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Audit Log</p>
              <p className="text-sm text-muted-foreground">View activity history</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link href="/dashboard/settings/email-logs" className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Email Activity</p>
              <p className="text-sm text-muted-foreground">View sent emails and status</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
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
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                {...businessForm.register('name')}
              />
              {businessForm.formState.errors.name && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gstin">GST Number (GSTIN)</Label>
              <p className="text-xs text-muted-foreground">Your 15-digit tax identification number</p>
              <Input
                id="gstin"
                className="uppercase font-mono"
                maxLength={15}
                {...businessForm.register('gstin')}
              />
              {businessForm.formState.errors.gstin && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.gstin.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN (Tax ID)</Label>
              <p className="text-xs text-muted-foreground">10-character tax ID for income tax filing</p>
              <Input
                id="pan"
                className="uppercase font-mono"
                maxLength={10}
                {...businessForm.register('pan')}
              />
              {businessForm.formState.errors.pan && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.pan.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fssaiNumber">FSSAI (for food businesses)</Label>
              <Input
                id="fssaiNumber"
                maxLength={14}
                {...businessForm.register('fssaiNumber')}
              />
              {businessForm.formState.errors.fssaiNumber && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.fssaiNumber.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...businessForm.register('phone')}
              />
              {businessForm.formState.errors.phone && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...businessForm.register('email')}
              />
              {businessForm.formState.errors.email && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...businessForm.register('address')}
            />
            {businessForm.formState.errors.address && (
              <p className="text-sm text-destructive">{businessForm.formState.errors.address.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...businessForm.register('state')}
              />
              {businessForm.formState.errors.state && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.state.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pincode">PIN Code</Label>
              <Input
                id="pincode"
                maxLength={6}
                {...businessForm.register('pincode')}
              />
              {businessForm.formState.errors.pincode && (
                <p className="text-sm text-destructive">{businessForm.formState.errors.pincode.message}</p>
              )}
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
              <Label htmlFor="invoicePrefix">Bill Prefix</Label>
              <Input
                id="invoicePrefix"
                value={settingsForm.invoicePrefix}
                onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label id="defaultLanguage-label">Default Language</Label>
              <Select
                value={settingsForm.defaultLanguage}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, defaultLanguage: v })}
                aria-labelledby="defaultLanguage-label"
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
              <Label id="decimalPlaces-label">Decimal Places</Label>
              <p className="text-xs text-muted-foreground">Number of decimal places in prices (2 = ₹1.00)</p>
              <Select
                value={settingsForm.decimalPlaces}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, decimalPlaces: v })}
                aria-labelledby="decimalPlaces-label"
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
                  <Label id="roundOffEnabled-label">Round Off</Label>
                  <p className="text-xs text-muted-foreground">Round totals to nearest rupee</p>
                </div>
                <Switch
                  id="roundOffEnabled"
                  checked={settingsForm.roundOffEnabled}
                  onCheckedChange={(v) => setSettingsForm({ ...settingsForm, roundOffEnabled: v })}
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

      {/* Stock Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Stock Alerts</CardTitle>
          </div>
          <CardDescription>Configure notification thresholds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label id="lowStockAlertDays-label">Low Stock Alert (days before)</Label>
              <p className="text-xs text-muted-foreground">Alert me this many days before stock runs out</p>
              <Select
                value={settingsForm.lowStockAlertDays}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, lowStockAlertDays: v })}
                aria-labelledby="lowStockAlertDays-label"
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
              <Label id="expiryAlertDays-label">Expiry Alert (days before)</Label>
              <p className="text-xs text-muted-foreground">Alert me this many days before products expire</p>
              <Select
                value={settingsForm.expiryAlertDays}
                onValueChange={(v) => v && setSettingsForm({ ...settingsForm, expiryAlertDays: v })}
                aria-labelledby="expiryAlertDays-label"
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
          <Form {...loyaltyForm}>
            <div className="space-y-4">
              <FormField
                control={loyaltyForm.control}
                name="loyaltyEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable Loyalty Program</FormLabel>
                      <FormDescription>Allow customers to earn and redeem points</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        id="loyaltyEnabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={loyaltyForm.control}
                  name="pointsPerRupee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points per ₹100 spent</FormLabel>
                      <FormControl>
                        <Input
                          id="pointsPerRupee"
                          type="number"
                          step="0.5"
                          min="0"
                          disabled={!loyaltyForm.watch('loyaltyEnabled')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>How many points a customer earns for every ₹100 spent</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loyaltyForm.control}
                  name="rupeePerPoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>₹ Value per point</FormLabel>
                      <FormControl>
                        <Input
                          id="rupeePerPoint"
                          type="number"
                          step="0.01"
                          min="0"
                          disabled={!loyaltyForm.watch('loyaltyEnabled')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Cash value when customer redeems points</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={loyaltyForm.control}
                  name="minimumRedemption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum redemption points</FormLabel>
                      <FormControl>
                        <Input
                          id="minimumRedemption"
                          type="number"
                          min="0"
                          disabled={!loyaltyForm.watch('loyaltyEnabled')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Customer needs at least this many points before they can use them</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loyaltyForm.control}
                  name="pointsExpiryDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points expiry (days)</FormLabel>
                      <FormControl>
                        <Input
                          id="pointsExpiryDays"
                          type="number"
                          min="0"
                          disabled={!loyaltyForm.watch('loyaltyEnabled')}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Points expire after this many days (0 = never expire)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button onClick={handleSaveLoyalty} disabled={updateLoyalty.isPending} className="gap-2">
                {updateLoyalty.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Loyalty Settings
              </Button>
            </div>
          </Form>
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
                    placeholder="Min 6 characters"
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
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

          {/* 2FA Enrollment Dialog */}
          <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
                <DialogDescription>Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)</DialogDescription>
              </DialogHeader>
              {twoFASecret && (
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-lg border bg-white p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFASecret.uri)}`}
                        alt="2FA QR Code"
                        className="h-48 w-48"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      Can&apos;t scan? Enter this secret manually:
                    </p>
                    <code className="rounded bg-muted px-3 py-1 text-sm font-mono break-all">
                      {twoFASecret.secret}
                    </code>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code">Verification Code</Label>
                    <Input
                      id="2fa-code"
                      placeholder="Enter 6-digit code"
                      value={twoFACode}
                      onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setShow2FADialog(false); setTwoFASecret(null); setTwoFACode('') }}>Cancel</Button>
                <Button onClick={handleVerify2FA} disabled={verifying2FA || twoFACode.length !== 6} className="gap-2">
                  {verifying2FA && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify & Enable
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Extra Login Security</p>
              <p className="text-sm text-muted-foreground">Protect your account with an authenticator app (TOTP)</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleEnable2FA} disabled={enrolling2FA}>
              {enrolling2FA ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up...</> : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>Configure which emails are sent automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...notifForm}>
            <div className="space-y-4">
              <FormField
                control={notifForm.control}
                name="emailNotificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email notifications</p>
                      <FormDescription>Enable or disable all email notifications</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={notifForm.control}
                name="invoiceAutoSend"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-send bill receipts</p>
                      <FormDescription>Email receipt to customer after each sale</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!notifForm.watch('emailNotificationsEnabled')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notifForm.control}
                name="lowStockEmailAlerts"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Low stock email alerts</p>
                      <FormDescription>Get email when products run low</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!notifForm.watch('emailNotificationsEnabled')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={notifForm.control}
                name="shiftSummaryEmail"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Shift summary email</p>
                      <FormDescription>Email shift summary when shift is closed</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!notifForm.watch('emailNotificationsEnabled')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Separator />
              <FormField
                control={notifForm.control}
                name="paymentReminderFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment reminder frequency</FormLabel>
                    <FormDescription>How often to email customers with outstanding balance</FormDescription>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!notifForm.watch('emailNotificationsEnabled')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="BIWEEKLY">Every 2 weeks</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button onClick={handleSaveNotifications} disabled={updateNotifications.isPending} className="gap-2">
                {updateNotifications.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Notification Settings
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}