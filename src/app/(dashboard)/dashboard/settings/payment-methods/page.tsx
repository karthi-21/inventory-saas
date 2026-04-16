'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, CreditCard, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface PaymentConfig {
  id: string
  storeId: string
  merchantVPA: string
  merchantName: string
  phonepeEnabled: boolean
  cashEnabled: boolean
  cardEnabled: boolean
  upiQrEnabled: boolean
  autoSendReceipt: boolean
}

export default function PaymentMethodsPage() {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery<PaymentConfig | null>({
    queryKey: ['payment-config'],
    queryFn: async () => {
      const res = await fetch('/api/payment-config')
      if (!res.ok) return null
      const data = await res.json()
      return data.data || null
    },
  })

  const [form, setForm] = useState({
    merchantVPA: '',
    merchantName: '',
    phonepeEnabled: true,
    cashEnabled: true,
    cardEnabled: false,
    upiQrEnabled: true,
    autoSendReceipt: true,
  })

  // Sync form when config loads
  useEffect(() => {
    if (config) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        merchantVPA: config.merchantVPA || '',
        merchantName: config.merchantName || '',
        phonepeEnabled: config.phonepeEnabled,
        cashEnabled: config.cashEnabled,
        cardEnabled: config.cardEnabled,
        upiQrEnabled: config.upiQrEnabled,
        autoSendReceipt: config.autoSendReceipt,
      })
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payment-config', {
        method: config ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save payment config')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Payment settings saved')
      queryClient.invalidateQueries({ queryKey: ['payment-config'] })
    },
    onError: () => toast.error('Failed to save payment settings'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Payment Methods
          </h1>
          <p className="text-muted-foreground">Configure how your store accepts payments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>UPI Settings</CardTitle>
          <CardDescription>Configure UPI payment collection via PhonePe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Merchant VPA</Label>
            <p className="text-xs text-muted-foreground mb-1">Your UPI ID for receiving payments (e.g. yourshop@phonepe)</p>
            <Input
              value={form.merchantVPA}
              onChange={e => setForm(f => ({ ...f, merchantVPA: e.target.value }))}
              placeholder="yourshop@phonepe"
            />
          </div>
          <div>
            <Label>Merchant Display Name</Label>
            <p className="text-xs text-muted-foreground mb-1">Name shown to customers in UPI apps</p>
            <Input
              value={form.merchantName}
              onChange={e => setForm(f => ({ ...f, merchantName: e.target.value }))}
              placeholder="My Store"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accepted Payment Methods</CardTitle>
          <CardDescription>Toggle payment methods on or off. Disabled methods won&apos;t appear in POS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cash</p>
              <p className="text-sm text-muted-foreground">Accept cash payments at counter</p>
            </div>
            <Switch
              checked={form.cashEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, cashEnabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">UPI (PhonePe)</p>
              <p className="text-sm text-muted-foreground">Accept UPI payments via PhonePe gateway</p>
            </div>
            <Switch
              checked={form.phonepeEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, phonepeEnabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">UPI QR Code</p>
              <p className="text-sm text-muted-foreground">Show QR code for customer to scan and pay</p>
            </div>
            <Switch
              checked={form.upiQrEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, upiQrEnabled: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Card</p>
              <p className="text-sm text-muted-foreground">Record card payments (manual entry)</p>
            </div>
            <Switch
              checked={form.cardEnabled}
              onCheckedChange={v => setForm(f => ({ ...f, cardEnabled: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Settings</CardTitle>
          <CardDescription>Configure automatic receipt delivery</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-send receipt</p>
              <p className="text-sm text-muted-foreground">Email receipt to customer after payment</p>
            </div>
            <Switch
              checked={form.autoSendReceipt}
              onCheckedChange={v => setForm(f => ({ ...f, autoSendReceipt: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Save Payment Settings
      </Button>
    </div>
  )
}