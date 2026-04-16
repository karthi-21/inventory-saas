'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Store, Loader2, CheckCircle2, Building2, MapPin, Phone, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingStatus {
  hasExistingStore: boolean
  storeCount: number
  tenant?: {
    id: string
    name: string
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    storeName: '',
    storeCode: '',
    address: '',
    phone: '',
    state: '',
    pincode: '',
  })
  const [additionalStoreForm, setAdditionalStoreForm] = useState({
    storeName: '',
    storeCode: '',
    address: '',
    phone: '',
    state: '',
    pincode: '',
  })
  const [createdStores, setCreatedStores] = useState<string[]>([])

  // Check if user already has a store
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/onboarding/status')
        if (res.ok) {
          const data: OnboardingStatus = await res.json()
          if (data.hasExistingStore) {
            // User already has a store, redirect to dashboard
            router.push('/dashboard')
            return
          }
          // Pre-fill store name from tenant if available
          if (data.tenant?.name) {
            setFormData(prev => ({
              ...prev,
              storeName: data.tenant!.name
            }))
          }
        }
      } catch (e) {
        console.error('Error checking onboarding status:', e)
      } finally {
        setIsLoading(false)
      }
    }
    checkStatus()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create store')
      }

      // Store created successfully, show add more stores option
      setCreatedStores([formData.storeName])
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAnotherStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!additionalStoreForm.storeName.trim() || !additionalStoreForm.storeCode.trim()) {
      setError('Store name and code are required')
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/onboarding/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(additionalStoreForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create store')
      }

      setCreatedStores([...createdStores, additionalStoreForm.storeName])
      setAdditionalStoreForm({ storeName: '', storeCode: '', address: '', phone: '', state: '', pincode: '' })
      toast.success('Store added successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkipToDashboard = () => {
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/25 mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Ezvento</h1>
          <p className="text-slate-600">Let&apos;s set up your first store to get started</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-sm font-medium`}>
              {step > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
            </div>
            <span className={`text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-slate-500'}`}>Store Details</span>
          </div>
          <div className={`w-12 h-0.5 ${step > 1 ? 'bg-blue-300' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full ${step > 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-sm font-medium`}>
              2
            </div>
            <span className={`text-sm ${step > 1 ? 'font-medium text-blue-600' : 'text-slate-500'}`}>{step > 1 ? 'More Stores' : 'Complete'}</span>
          </div>
        </motion.div>

        {/* Step 1: Store Form */}
        {step === 1 && (
          <>
            <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Store Information
              </CardTitle>
              <CardDescription>
                Enter your store details to create your first location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Store Name */}
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name *</Label>
                  <Input
                    id="storeName"
                    placeholder="e.g., Sharma Electronics"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                {/* Store Code */}
                <div className="space-y-2">
                  <Label htmlFor="storeCode">Store Code *</Label>
                  <Input
                    id="storeCode"
                    placeholder="e.g., MAIN001"
                    value={formData.storeCode}
                    onChange={(e) => setFormData({ ...formData, storeCode: e.target.value.toUpperCase() })}
                    required
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">A unique identifier for your store (e.g., MAIN001, BRANCH01)</p>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    id="address"
                    placeholder="Full store address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g., +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-11"
                  />
                </div>

                {/* State & Pincode */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g., Tamil Nadu"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="e.g., 600001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Store...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Create Store & Continue
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skip Option */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-slate-500 mt-6"
        >
          You can update these details later in Settings
        </motion.p>
          </>
        )}

        {/* Step 2: Add More Stores or Skip to Dashboard */}
        {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-xl shadow-slate-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Store Created!
              </CardTitle>
              <CardDescription>
                Your first store has been created. You can add more stores now or skip to the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Created stores list */}
              <div className="space-y-2">
                {createdStores.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">{name}</span>
                  </div>
                ))}
              </div>

              {/* Add another store form */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Add Another Store</h3>
                <form onSubmit={handleAddAnotherStore} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addStoreName">Store Name *</Label>
                      <Input
                        id="addStoreName"
                        placeholder="e.g., Branch Store"
                        value={additionalStoreForm.storeName}
                        onChange={(e) => setAdditionalStoreForm({ ...additionalStoreForm, storeName: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addStoreCode">Store Code *</Label>
                      <Input
                        id="addStoreCode"
                        placeholder="e.g., BRANCH01"
                        value={additionalStoreForm.storeCode}
                        onChange={(e) => setAdditionalStoreForm({ ...additionalStoreForm, storeCode: e.target.value.toUpperCase() })}
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addStoreAddress">Address</Label>
                    <Input
                      id="addStoreAddress"
                      placeholder="Store address"
                      value={additionalStoreForm.address}
                      onChange={(e) => setAdditionalStoreForm({ ...additionalStoreForm, address: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addStorePhone">Phone</Label>
                      <Input
                        id="addStorePhone"
                        placeholder="+91 98765 43210"
                        value={additionalStoreForm.phone}
                        onChange={(e) => setAdditionalStoreForm({ ...additionalStoreForm, phone: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addStoreState">State</Label>
                      <Input
                        id="addStoreState"
                        placeholder="e.g., Tamil Nadu"
                        value={additionalStoreForm.state}
                        onChange={(e) => setAdditionalStoreForm({ ...additionalStoreForm, state: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full gap-2"
                    disabled={isSubmitting || !additionalStoreForm.storeName.trim() || !additionalStoreForm.storeCode.trim()}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add Another Store
                  </Button>
                </form>
              </div>

              <Button
                onClick={handleSkipToDashboard}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        )}
      </div>
    </div>
  )
}
