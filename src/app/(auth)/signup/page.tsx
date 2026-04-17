'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Store, Star, Mail, Lock, Phone } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

// Feature flags for auth providers
const ENABLE_EMAIL_AUTH = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH !== 'false'
const ENABLE_GOOGLE_AUTH = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === 'true'
const ENABLE_PHONE_AUTH = process.env.NEXT_PUBLIC_ENABLE_PHONE_AUTH === 'true'

const plans = {
  launch: {
    id: 'launch',
    name: 'Launch',
    price: 999,
    priceDisplay: '₹999',
    period: '/month',
    description: 'Perfect for a single store',
    features: ['1 Store', '3 Users', 'GST Billing', 'Stock Tracking', 'Email Support'],
    highlight: false,
  },
  grow: {
    id: 'grow',
    name: 'Grow',
    price: 2499,
    priceDisplay: '₹2,499',
    period: '/month',
    description: 'Growing retail businesses',
    features: ['3 Stores', '10 Users', 'Full Stock', 'Multi-Payment', 'Customer Management', 'Reports & Export', 'Priority Support'],
    highlight: true,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    price: 0,
    priceDisplay: 'Custom',
    period: '',
    description: 'Franchises & large operations',
    features: ['Unlimited Stores', 'Unlimited Users', 'Custom Roles', 'API Access', 'White-label', 'Dedicated Support'],
    highlight: false,
  },
}

type PlanKey = keyof typeof plans

function SignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState<'plan' | 'signup'>('plan')
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('grow')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isPhoneLoading, setIsPhoneLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [emailConfirmSent, setEmailConfirmSent] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)
  const [emailResendTimer, setEmailResendTimer] = useState(0)

  // Get plan from URL param
  useEffect(() => {
    const planParam = searchParams.get('plan') as PlanKey | null
    if (planParam && plans[planParam]) {
      setSelectedPlan(planParam)
      setStep('signup')
    }
  }, [searchParams])

  const plan = plans[selectedPlan]

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?plan=${selectedPlan}`,
        },
      })

      if (error) {
        setAuthError(error.message)
        setIsGoogleLoading(false)
      }
    } catch {
      setAuthError('Failed to initiate Google sign in. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setAuthError('Please enter email and password')
      return
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters')
      return
    }

    setIsEmailLoading(true)
    setAuthError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            plan: selectedPlan,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?plan=${selectedPlan}`,
        },
      })

      if (error) {
        if (error.message.includes('rate_limit') || error.message.includes('over_email_send_rate_limit')) {
          setAuthError('Email rate limit reached. Please wait a few minutes and try again, or use Phone OTP instead.')
        } else {
          setAuthError(error.message)
        }
        setIsEmailLoading(false)
        return
      }

      if (data.user && data.user.email_confirmed_at) {
        // Email already confirmed (for some providers)
        localStorage.setItem('selected_plan', selectedPlan)
        localStorage.setItem('user_email', email)
        router.push(`/payment?plan=${selectedPlan}`)
      } else if (data.user) {
        // Email not confirmed yet - stay on page, show message
        localStorage.setItem('selected_plan', selectedPlan)
        localStorage.setItem('user_email', email)
        setEmailConfirmSent(true)
        setAuthError(null)
      }
    } catch {
      setAuthError('Failed to sign up. Please try again.')
    } finally {
      setIsEmailLoading(false)
    }
  }

  const handlePhoneSignIn = async () => {
    if (!phone || phone.length < 10) {
      setAuthError('Please enter a valid phone number')
      return
    }

    setIsPhoneLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+91${phone}`,
        options: {
          data: {
            plan: selectedPlan,
          },
        },
      })

      if (error) {
        setAuthError(error.message)
        setIsPhoneLoading(false)
        return
      }

      setOtpSent(true)
      setResendTimer(30)
      toast.success('OTP sent to your phone!')
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setIsPhoneLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      setAuthError('Please enter the 6-digit OTP')
      return
    }

    setIsPhoneLoading(true)
    setAuthError(null)

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+91${phone}`,
        token: otp,
        type: 'sms',
      })

      if (error) {
        setAuthError(error.message)
        setIsPhoneLoading(false)
        return
      }

      localStorage.setItem('selected_plan', selectedPlan)
      localStorage.setItem('phone', `+91${phone}`)
      toast.success('Phone verified!')
      router.push(`/payment?plan=${selectedPlan}`)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid OTP. Please try again.')
    } finally {
      setIsPhoneLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    await handlePhoneSignIn()
  }

  // Timer for resend button
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Timer for email resend button
  useEffect(() => {
    if (emailResendTimer > 0) {
      const timer = setTimeout(() => setEmailResendTimer(emailResendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [emailResendTimer])

  const handleResendEmail = async () => {
    if (emailResendTimer > 0 || !email) return

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?plan=${selectedPlan}`,
        },
      })

      if (error) {
        setAuthError(error.message)
        return
      }

      setEmailResendTimer(60)
      toast.success('Confirmation email resent!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('rate_limit')) {
        setAuthError('Email rate limit reached. Please wait a few minutes before resending.')
      } else {
        setAuthError('Failed to resend email. Please try again.')
      }
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Plan Badge */}
      <div className="mb-4 text-center">
        <Badge variant={plan.highlight ? 'default' : 'secondary'} className="text-sm">
          {plan.highlight && <Star className="w-3 h-3 mr-1" />}
          {selectedPlan === 'scale' ? 'Contact Sales for pricing' : `${plan.priceDisplay}${plan.period} · 14-day free trial`}
        </Badge>
      </div>

      {/* Plan Selector (if user wants to change) */}
      {step === 'signup' && (
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{plan.name} Plan</span>
              </div>
              <button
                onClick={() => setStep('plan')}
                className="text-xs text-primary hover:underline"
              >
                Change plan
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <img src="/logo.svg" alt="Ezvento" className="h-12" />
          </div>
          <CardTitle className="text-2xl">
            {step === 'plan' ? 'Choose your plan' : otpSent ? 'Enter OTP' : 'Create your account'}
          </CardTitle>
          <CardDescription>
            {step === 'plan'
              ? 'You can change this anytime later'
              : otpSent
              ? `We sent a code to +91 ${phone}`
              : 'Start your 14-day free trial. No credit card required.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Plan Selection Step */}
          {step === 'plan' && (
            <div className="space-y-4">
              {Object.entries(plans).map(([key, p]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key as PlanKey)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedPlan === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">{p.description}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{p.priceDisplay}</span>
                      {p.period && <span className="text-xs text-muted-foreground">{p.period}</span>}
                    </div>
                  </div>
                </button>
              ))}
              <Button onClick={() => setStep('signup')} className="w-full">
                Continue with {plans[selectedPlan].name}
              </Button>
            </div>
          )}

          {/* Signup Step */}
          {step === 'signup' && !otpSent && (
            <div className="space-y-4">
              {authError && (
                <div className="p-3 text-sm text-white bg-destructive rounded-md">
                  {authError}
                </div>
              )}

              {/* Email Confirmation Sent State */}
              {emailConfirmSent ? (
                <div className="space-y-3 text-center py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Check your email</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We sent a confirmation link to<br />
                      <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the link in your email to activate your account and continue to payment.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResendEmail}
                      disabled={emailResendTimer > 0}
                    >
                      {emailResendTimer > 0 ? `Resend email in ${emailResendTimer}s` : 'Resend confirmation email'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setEmailConfirmSent(false)}
                    >
                      Use different email
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Google OAuth - conditional */}
                  {ENABLE_GOOGLE_AUTH && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading}
                      >
                        {isGoogleLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        )}
                        Continue with Google
                      </Button>

                      <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                          or
                        </span>
                      </div>
                    </>
                  )}

                  {/* Email/Password Signup - conditional */}
                  {ENABLE_EMAIL_AUTH && (
                    <>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="you@yourstore.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type="password"
                              placeholder="Min 6 characters"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleEmailSignUp}
                          disabled={isEmailLoading || !email || !password}
                        >
                          {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Sign Up with Email
                        </Button>
                      </div>

                      {(ENABLE_GOOGLE_AUTH || ENABLE_PHONE_AUTH) && (
                        <div className="relative">
                          <Separator />
                          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                            or
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Phone OTP - conditional */}
                  {ENABLE_PHONE_AUTH && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Phone number</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center justify-center w-14 bg-muted rounded-md text-sm font-medium">
                            +91
                          </div>
                          <Input
                            type="tel"
                            placeholder="98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={handlePhoneSignIn}
                        disabled={isPhoneLoading || phone.length < 10}
                      >
                        {isPhoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Phone className="mr-2 h-4 w-4" />
                        Get OTP
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    By continuing, you agree to Ezvento{' '}
                    <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
                  </p>
                </>
              )}
            </div>
          )}

          {/* OTP Verification Step */}
          {step === 'signup' && otpSent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter 6-digit code</Label>
                <Input
                  type="text"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-3 py-3 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={isPhoneLoading || otp.length < 6}
              >
                {isPhoneLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Continue
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Use different phone number
              </button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function SignupLoading() {
  return (
    <div className="w-full max-w-lg">
      <div className="mb-4 text-center">
        <Badge variant="secondary" className="text-sm">Loading...</Badge>
      </div>
      <Card>
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  )
}
