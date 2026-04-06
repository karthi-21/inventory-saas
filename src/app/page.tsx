import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Store,
  Smartphone,
  ReceiptIndianRupee,
  Users,
  Package,
  BarChart3,
  Shield,
  ArrowRight,
  Check,
  Star,
  CreditCard,
  Truck,
  Headphones,
  ShieldCheck,
  Clock,
  Zap,
  Printer,
  Tablet,
  ArrowDown,
} from 'lucide-react'

const features = [
  {
    icon: Store,
    title: 'Multi-Store Support',
    description: 'Manage multiple storefronts, warehouses, and inventory locations from one dashboard.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'GST-Compliant Billing',
    description: 'B2C & B2B invoices, GSTR-1/3B export. Built for Indian tax compliance.',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    description: 'Batch, expiry, serial number tracking. Alerts for low stock and expiring items.',
  },
  {
    icon: Users,
    title: 'Role-Based Personas',
    description: 'Configure custom roles — Admin, Manager, Vendor, Billing — without code.',
  },
  {
    icon: Smartphone,
    title: 'Touch POS',
    description: 'Fast, responsive point-of-sale interface. Works on tablet and desktop.',
  },
  {
    icon: BarChart3,
    title: 'Reports & Export',
    description: 'Sales, stock, GST summaries. Export to Excel and CSV in one click.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Row-level tenant isolation, encrypted data, daily backups. India-hosted.',
  },
]

const highlights = [
  {
    icon: Tablet,
    text: 'Works on tablet',
    sub: 'iPad, Android, Windows touch',
  },
  {
    icon: Printer,
    text: 'Prints on 58mm thermal printers',
    sub: 'Epson, Star, ESC/POS compatible',
  },
]

const storeTypes = [
  {
    label: 'Electronics',
    description: 'Serial & warranty tracking',
    tag: 'GST Ready',
    highlightPlan: 'grow',
  },
  {
    label: 'Clothing & Apparel',
    description: 'Size/color variants',
    tag: 'GST Ready',
    highlightPlan: 'grow',
  },
  {
    label: 'Grocery & Supermarket',
    description: 'Batch & expiry tracking',
    tag: 'GST Ready',
    highlightPlan: 'grow',
  },
  {
    label: 'Fresh Items / FSSAI',
    description: 'Mandatory expiry alerts',
    tag: 'FSSAI',
    highlightPlan: 'grow',
  },
  {
    label: 'Restaurant / Food',
    description: 'Tables, KOT, combos',
    tag: 'POS + KOT',
    highlightPlan: 'grow',
  },
  {
    label: 'Wholesale',
    description: 'Credit & loyalty management',
    tag: 'Credit + GST',
    highlightPlan: 'launch',
  },
]

const plans = [
  {
    id: 'launch',
    name: 'Launch',
    price: '₹999',
    period: '/month',
    description: 'Perfect for a single store',
    badge: null,
    features: [
      '1 Store',
      '3 Users',
      'GST Billing',
      'Inventory Tracking',
      'Email Support',
    ],
    highlight: false,
    cta: 'Start Free Trial',
  },
  {
    id: 'grow',
    name: 'Grow',
    price: '₹2,499',
    period: '/month',
    description: 'Growing retail businesses',
    badge: 'Most Popular',
    features: [
      '3 Stores',
      '10 Users',
      'Full Inventory',
      'Multi-Payment',
      'Customer Management',
      'Reports & Export',
      'Priority Support',
    ],
    highlight: true,
    cta: 'Start Free Trial',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 'Custom',
    period: '',
    description: 'Franchises & large operations',
    badge: null,
    features: [
      'Unlimited Stores',
      'Unlimited Users',
      'Custom Roles',
      'API Access',
      'White-label',
      'Dedicated Support',
    ],
    highlight: false,
    cta: 'Contact Sales',
  },
]

const testimonials = [
  {
    quote: "Set up my electronics store in 15 minutes. GST billing was the biggest headache before this.",
    author: "Rajesh Kumar",
    business: "Sharma Electronics, Chennai",
    plan: "Grow",
  },
  {
    quote: "We manage 3 grocery outlets from one dashboard. Stock alerts save us thousands every month.",
    author: "Priya Patel",
    business: "FreshMart Supermarket, Ahmedabad",
    plan: "Grow",
  },
  {
    quote: "The POS is so fast our billing queue reduced by half. Staff learned it in 5 minutes.",
    author: "Mohammed Ali",
    business: "Fresh Zone, Hyderabad",
    plan: "Launch",
  },
]

const faqs = [
  {
    q: "What happens after the 14-day free trial?",
    a: "Your store data is preserved for 30 days. Subscribe anytime to continue. If you don't subscribe, your data is automatically deleted after 30 days.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes, upgrade or downgrade anytime. When upgrading, you're credited for unused days. When downgrading, the change takes effect at the next billing cycle.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is encrypted at rest and in transit. We use row-level security to ensure each business only sees their own data. Daily backups with 30-day retention.",
  },
  {
    q: "Do I need an accountant for GST filing?",
    a: "You can export GSTR-1 and GSTR-3B data directly in the format your accountant needs. Many small retailers file themselves using our reports.",
  },
  {
    q: "What payment methods can my customers use?",
    a: "Your customers can pay via Cash, UPI (GPay, PhonePe, Paytm, BHIM), Debit/Credit Card, or Credit (if you enable it). Split payments are also supported.",
  },
  {
    q: "Does it work on tablet?",
    a: "Yes! The POS interface is optimized for touch. Works on iPad, Android tablets, and any Windows touchscreen device.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">OmniBIZ</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </a>
            <a href="#store-types" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Solutions
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Star className="mr-1 h-3 w-3" />
              Trusted by 500+ retailers across India
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your store,{' '}
              <span className="text-primary">digitized</span>
              <br />
              in under 10 minutes
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Multi-store POS & billing software for Indian retailers. Electronics, clothing,
              grocery, restaurants — all in one platform. GST-compliant, multi-language, built
              for South India.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="gap-2">
                  See Features <ArrowDown className="h-4 w-4" />
                </Button>
              </a>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                14-day free trial
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Comparison */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-red-600 mb-4">BEFORE</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✕</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Separate billing software + inventory sheet + accountant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✕</span>
                    </div>
                    <span className="text-sm text-muted-foreground">2 people to manage billing and stock</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✕</span>
                    </div>
                    <span className="text-sm text-muted-foreground">GST filing takes 2 days every month</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">✕</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Excel sheets for tracking stock</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/10">
              <CardContent className="p-6">
                <p className="text-sm font-semibold text-green-600 mb-4">AFTER</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">One app for billing, inventory, and reports</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">1 person manages everything</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">GST export in 5 minutes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm text-muted-foreground">Real-time stock alerts automatically</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2">
            {highlights.map((h) => (
              <div key={h.text} className="flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <h.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{h.text}</p>
                  <p className="text-sm text-muted-foreground">{h.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to run your store
            </h2>
            <p className="mt-4 text-muted-foreground">
              From billing to inventory to reports — all integrated, all fast.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Store Types */}
      <section id="store-types" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for every retail type
            </h2>
            <p className="mt-4 text-muted-foreground">
              Smart defaults that match your business — no setup headaches.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {storeTypes.map((type) => (
              <a
                key={type.label}
                href="#pricing"
                className="block"
              >
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 h-full">
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{type.label}</p>
                        <Badge variant="secondary" className="text-xs">
                          {type.tag}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by retailers across India
            </h2>
            <p className="mt-4 text-muted-foreground">
              From single shops to multi-store operations.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-white dark:bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">"{t.quote}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{t.author}</p>
                      <p className="text-xs text-muted-foreground">{t.business}</p>
                    </div>
                    <Badge variant="outline">{t.plan}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pay per store, no hidden fees. Upgrade or cancel anytime.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border'}
              >
                <CardHeader>
                  {plan.badge && (
                    <Badge className="mb-2 w-fit bg-primary text-primary-foreground">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={`/signup?plan=${plan.id}`} className="block">
                    <Button
                      className="w-full"
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about OmniBIZ.
            </p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-5 w-5 text-primary" />
              <span>India-Hosted Servers</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-5 w-5 text-primary" />
              <span>99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Headphones className="h-5 w-5 text-primary" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Powered By */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Built on trusted infrastructure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-60">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-black dark:bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-white dark:text-black">R</span>
              </div>
              <span className="text-sm font-medium">Razorpay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-black dark:bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-white dark:text-black">S</span>
              </div>
              <span className="text-sm font-medium">Supabase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-black dark:bg-white flex items-center justify-center">
                <span className="text-xs font-bold text-white dark:text-black">V</span>
              </div>
              <span className="text-sm font-medium">Vercel</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to digitize your store?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Set up in under 10 minutes. No IT team needed.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Start Your Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">OmniBIZ</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground">Privacy Policy</a>
              <a href="/terms" className="hover:text-foreground">Terms of Service</a>
              <a href="/support" className="hover:text-foreground">Support</a>
              <a href="/gst-help" className="hover:text-foreground">GST Help</a>
              <a href="/contact" className="hover:text-foreground">Contact</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 OmniBIZ. Made for Indian retailers.
            </p>
          </div>
          <Separator className="my-6" />
          <p className="text-xs text-muted-foreground text-center">
            GSTIN validation powered by government APIs. For display purposes only — always verify independently.
          </p>
        </div>
      </footer>
    </div>
  )
}
