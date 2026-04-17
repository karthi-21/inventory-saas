'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Smartphone, Check, XCircle, RefreshCw } from 'lucide-react'

interface UPIPaymentDialogProps {
  open: boolean
  onClose: () => void
  invoiceId: string | null
  amount: number
  onSuccess: (paymentRef: string) => void
  onFail: () => void
}

type PaymentState = 'initiating' | 'pending' | 'success' | 'failed' | 'expired'

export function UPIPaymentDialog({ open, onClose, invoiceId, amount, onSuccess, onFail }: UPIPaymentDialogProps) {
  const [paymentState, setPaymentState] = useState<PaymentState>('initiating')
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pollCount, setPollCount] = useState(0)

  // Initiate PhonePe payment
  const initiatePayment = useCallback(async () => {
    if (!invoiceId) return

    setPaymentState('initiating')
    setError(null)
    setQrCodeUrl(null)
    setTransactionId(null)

    try {
      const res = await fetch('/api/payments/pos/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount, method: 'UPI_QR' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment')
      }

      if (data.transactionId) {
        setTransactionId(data.transactionId)
      }

      if (data.qrCode) {
        setQrCodeUrl(data.qrCode)
        setPaymentState('pending')
      } else if (data.redirectUrl) {
        // PhonePe intent flow — redirect customer
        window.open(data.redirectUrl, '_blank')
        setPaymentState('pending')
      } else if (data.status === 'SUCCESS') {
        // Cash or already-paid scenario
        setPaymentState('success')
        onSuccess(data.transactionId || '')
      } else {
        // Fallback: generate a simple UPI QR from VPA
        setQrCodeUrl(null)
        setPaymentState('pending')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed')
      setPaymentState('failed')
    }
  }, [invoiceId, amount, onSuccess])

  // Poll payment status
  useEffect(() => {
    if (paymentState !== 'pending' || !transactionId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/pos/status?transactionId=${transactionId}`)
        const data = await res.json()

        if (data.status === 'SUCCESS' || data.paymentStatus === 'SUCCESS') {
          setPaymentState('success')
          onSuccess(data.reference || transactionId)
          clearInterval(interval)
        } else if (data.status === 'FAILED' || data.paymentStatus === 'FAILED') {
          setPaymentState('failed')
          setError('Payment failed. Please try again.')
          onFail()
          clearInterval(interval)
        } else {
          setPollCount(c => c + 1)
        }
      } catch {
        // Continue polling on error
        setPollCount(c => c + 1)
      }
    }, 3000) // Poll every 3 seconds

    // Expire after 5 minutes (100 polls)
    const timeout = setTimeout(() => {
      if (paymentState === 'pending') {
        setPaymentState('expired')
        clearInterval(interval)
      }
    }, 5 * 60 * 1000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [paymentState, transactionId, onSuccess, onFail])

  // Initiate payment when dialog opens
  useEffect(() => {
    if (open && invoiceId) {
      initiatePayment()
    }
  }, [open, invoiceId, initiatePayment])

  const handleClose = () => {
    if (paymentState === 'pending') {
      if (!confirm('Payment is still pending. Are you sure you want to close?')) return
    }
    setPaymentState('initiating')
    setQrCodeUrl(null)
    setTransactionId(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            UPI Payment
          </DialogTitle>
          <DialogDescription>
            {paymentState === 'success' ? 'Payment received!' :
             paymentState === 'failed' ? 'Payment failed' :
             paymentState === 'expired' ? 'Payment expired' :
             `Ask customer to scan QR code to pay ₹${amount.toLocaleString('en-IN')}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <div className="text-center py-2">
            <p className="text-3xl font-bold">₹{amount.toLocaleString('en-IN')}</p>
          </div>

          {/* QR Code */}
          {paymentState === 'pending' && qrCodeUrl && (
            <div className="flex justify-center p-4 bg-white rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48" />
            </div>
          )}

          {/* No QR — show manual UPI info */}
          {paymentState === 'pending' && !qrCodeUrl && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                QR code not available. Ask customer to pay via UPI to the store VPA configured in Payment Settings.
              </p>
              <p className="text-xs text-muted-foreground">
                Configure your VPA in Settings → Payment Methods
              </p>
            </div>
          )}

          {/* Status indicators */}
          {paymentState === 'initiating' && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Creating payment request...</span>
            </div>
          )}

          {paymentState === 'pending' && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for payment... ({pollCount} checks)</span>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-medium text-green-600">Payment Received!</p>
            </div>
          )}

          {paymentState === 'failed' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="font-medium text-red-600">{error || 'Payment Failed'}</p>
            </div>
          )}

          {paymentState === 'expired' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <p className="font-medium text-amber-600">Payment request expired (5 min)</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-end">
            {paymentState === 'pending' && (
              <Button variant="outline" size="sm" onClick={initiatePayment}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate QR
              </Button>
            )}
            {paymentState === 'failed' && (
              <Button variant="outline" size="sm" onClick={initiatePayment}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Try Again
              </Button>
            )}
            {(paymentState === 'success' || paymentState === 'failed' || paymentState === 'expired') && (
              <Button onClick={handleClose}>
                {paymentState === 'success' ? 'Done' : 'Close'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}