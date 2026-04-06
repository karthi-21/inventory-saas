'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, Store, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StoreType } from '@/types'

const storeTypes: { value: StoreType; label: string; description: string }[] = [
  { value: 'ELECTRONICS', label: 'Electronics', description: 'Serial & warranty tracking' },
  { value: 'CLOTHING', label: 'Clothing & Apparel', description: 'Size/color variants' },
  { value: 'GROCERY', label: 'Grocery', description: 'Batch & expiry tracking' },
  { value: 'SUPERMARKET', label: 'Supermarket', description: 'Multi-category with expiry' },
  { value: 'WHOLESALE', label: 'Wholesale', description: 'Credit & bulk pricing' },
  { value: 'RESTAURANT', label: 'Restaurant / Food', description: 'Tables, KOT, combos' },
  { value: 'MULTI_CATEGORY', label: 'Multi-Category', description: 'General retail' },
]

const personaTemplates: Record<StoreType, string[]> = {
  ELECTRONICS: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Inventory Manager', 'Vendor Manager', 'Warehouse Staff'],
  CLOTHING: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Inventory Manager', 'Customer Relations'],
  GROCERY: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Inventory Manager', 'Vendor Manager'],
  SUPERMARKET: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Inventory Manager', 'Vendor Manager', 'Warehouse Staff'],
  WHOLESALE: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Vendor Manager', 'Customer Relations'],
  RESTAURANT: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Kitchen Staff', 'Table Host', 'Delivery Partner'],
  MULTI_CATEGORY: ['Owner/Admin', 'Store Manager', 'Billing Operator', 'Inventory Manager'],
}

const indianStates = [
  'Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana',
  'Maharashtra', 'Gujarat', 'Delhi', 'Uttar Pradesh', 'West Bengal',
  'Rajasthan', 'Madhya Pradesh', 'Punjab', 'Haryana', 'Chandigarh',
  'Odisha', 'Bihar', 'Jharkhand', 'Chhattisgarh', 'Assam',
  'Other'
]

const steps = [
  { id: 1, title: 'Business' },
  { id: 2, title: 'Store' },
  { id: 3, title: 'Location' },
  { id: 4, title: 'Team' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [selectedStoreType, setSelectedStoreType] = useState<StoreType | null>(null)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState('')

  // Form data
  const [formData, setFormData] = useState({
    businessName: '',
    gstin: '',
    pan: '',
    fssaiNumber: '',
    email: '',
    phone: '',
    storeName: '',
    storeCount: '1',
    address: '',
    pincode: '',
    state: '',
    hasExpiryTracking: false,
    hasSerialTracking: false,
    hasBatchTracking: false,
    hasMultiStore: false,
  })

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('omnibiz_onboarding_state')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.currentStep) setCurrentStep(parsed.currentStep)
        if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }))
        if (parsed.selectedStoreType) setSelectedStoreType(parsed.selectedStoreType)
        if (parsed.selectedPersonas) setSelectedPersonas(parsed.selectedPersonas)
        if (parsed.selectedState) {
          setSelectedState(parsed.selectedState)
        } else if (parsed.formData?.state) {
          setSelectedState(parsed.formData.state)
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  // Persist state to localStorage on change
  useEffect(() => {
    const state = {
      currentStep,
      formData,
      selectedStoreType,
      selectedPersonas,
      selectedState,
      lastSaved: new Date().toISOString()
    }
    localStorage.setItem('omnibiz_onboarding_state', JSON.stringify(state))
  }, [currentStep, formData, selectedStoreType, selectedPersonas, selectedState])

  const handleStoreTypeSelect = (type: StoreType) => {
    setSelectedStoreType(type)
    setSelectedPersonas(personaTemplates[type] || [])
  }

  const togglePersona = (persona: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(persona) ? prev.filter((p) => p !== persona) : [...prev, persona]
    )
  }

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, 4))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const handleComplete = async () => {
    if (!selectedStoreType) {
      toast.error('Please select a store type')
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeType: selectedStoreType,
          personas: selectedPersonas
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Onboarding failed')
      }

      // Clear localStorage
      localStorage.removeItem('omnibiz_onboarding_state')

      // Show success screen
      setIsComplete(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  // Success screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-muted-foreground mb-6">
              Your store has been configured. Let&apos;s start billing!
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/dashboard')} className="w-full">
                Go to Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/products')} className="w-full">
                Add Your First Product
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Tell us about your business</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll use this to configure GST settings and defaults.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  placeholder="e.g. Sharma Electronics"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    placeholder="27AABCU9603R1ZM"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    placeholder="AABCU9603R"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@store.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
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
              {(selectedStoreType === 'GROCERY' || selectedStoreType === 'SUPERMARKET' || selectedStoreType === 'RESTAURANT') && (
                <div className="space-y-2">
                  <Label htmlFor="fssai">FSSAI License Number</Label>
                  <Input
                    id="fssaiNumber"
                    placeholder="12345678901234"
                    value={formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">What type of store is this?</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll suggest the right features and default settings.
              </p>
            </div>
            <div className="grid gap-3">
              {storeTypes.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    selectedStoreType === type.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleStoreTypeSelect(type.value)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        selectedStoreType === type.value
                          ? 'bg-primary text-white'
                          : 'bg-muted'
                      }`}
                    >
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                    {selectedStoreType === type.value && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            {selectedStoreType && (
              <div className="space-y-2">
                <Label htmlFor="storeName">Primary Store Name *</Label>
                <Input
                  id="storeName"
                  placeholder="e.g. Chennai Showroom"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>
            )}
            {selectedStoreType && (
              <div className="space-y-2">
                <Label>Store Count</Label>
                <Select
                  value={formData.storeCount}
                  onValueChange={(v) => setFormData({ ...formData, storeCount: v || '1' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 store</SelectItem>
                    <SelectItem value="2">2 stores</SelectItem>
                    <SelectItem value="3">3 stores</SelectItem>
                    <SelectItem value="5">5 stores</SelectItem>
                    <SelectItem value="10">10+ stores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Store Location</h2>
              <p className="text-sm text-muted-foreground">
                This determines your GST rules (intra-state vs inter-state).
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Road, Area"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select
                    value={selectedState}
                    onValueChange={(v) => {
                      setSelectedState(v || '')
                      setFormData(prev => ({ ...prev, state: v || '' }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">PIN Code</Label>
                  <Input
                    id="pincode"
                    placeholder="600001"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium">Inventory Tracking</h3>
              <div className="space-y-3">
                {selectedStoreType !== 'RESTAURANT' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={formData.hasBatchTracking}
                      onChange={(e) => setFormData({ ...formData, hasBatchTracking: e.target.checked })}
                    />
                    <div>
                      <p className="font-medium">Batch & Expiry Tracking</p>
                      <p className="text-sm text-muted-foreground">Track manufacturing dates and expiry</p>
                    </div>
                  </label>
                )}
                {selectedStoreType === 'ELECTRONICS' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={formData.hasSerialTracking}
                      onChange={(e) => setFormData({ ...formData, hasSerialTracking: e.target.checked })}
                    />
                    <div>
                      <p className="font-medium">Serial Number Tracking</p>
                      <p className="text-sm text-muted-foreground">Track individual items and warranties</p>
                    </div>
                  </label>
                )}
                {(selectedStoreType === 'GROCERY' || selectedStoreType === 'SUPERMARKET' || selectedStoreType === 'RESTAURANT') && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={formData.hasExpiryTracking}
                      onChange={(e) => setFormData({ ...formData, hasExpiryTracking: e.target.checked })}
                    />
                    <div>
                      <p className="font-medium">Expiry Alerts</p>
                      <p className="text-sm text-muted-foreground">Get notified before items expire</p>
                    </div>
                  </label>
                )}
                {parseInt(formData.storeCount) > 1 && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={formData.hasMultiStore}
                      onChange={(e) => setFormData({ ...formData, hasMultiStore: e.target.checked })}
                    />
                    <div>
                      <p className="font-medium">Multi-Store Transfers</p>
                      <p className="text-sm text-muted-foreground">Transfer stock between locations</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Configure Your Team</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ve suggested personas based on your store type. You can customize them.
              </p>
            </div>
            <div className="space-y-3">
              {selectedPersonas.map((persona) => (
                <Card
                  key={persona}
                  className="cursor-pointer transition-all hover:border-primary/50"
                  onClick={() => togglePersona(persona)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      selectedPersonas.includes(persona) ? 'bg-primary text-white' : 'bg-muted'
                    }`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{persona}</p>
                      <p className="text-sm text-muted-foreground">
                        {persona === 'Owner/Admin' && 'Full access to all features'}
                        {persona === 'Store Manager' && 'Day-to-day operations'}
                        {persona === 'Billing Operator' && 'POS and billing only'}
                        {persona === 'Inventory Manager' && 'Stock and purchase management'}
                        {persona === 'Vendor Manager' && 'Supplier and purchase orders'}
                        {persona === 'Warehouse Staff' && 'Stock movements and adjustments'}
                        {persona === 'Kitchen Staff' && 'Kitchen order management'}
                        {persona === 'Table Host' && 'Table and reservation management'}
                        {persona === 'Delivery Partner' && 'Order delivery tracking'}
                        {persona === 'Customer Relations' && 'Customer management and loyalty'}
                      </p>
                    </div>
                    {selectedPersonas.includes(persona) && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Store className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Set up your store</h1>
          <p className="text-sm text-muted-foreground">This takes about 5 minutes</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  currentStep >= step.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Store className="h-5 w-5" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Step {currentStep}: {steps[currentStep - 1].title}
              </CardTitle>
              <Badge variant="secondary">{currentStep} of 4</Badge>
            </div>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
            >
              Save & Exit
            </Button>
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          {currentStep < 4 ? (
            <Button onClick={nextStep}>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
