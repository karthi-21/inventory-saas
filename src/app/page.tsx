'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SALES_EMAIL } from '@/config/emails'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  ArrowRight,
  Check,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Receipt,
  Package,
  Smartphone,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  CreditCard,
  WifiOff,
  ShoppingCart,
  BarChart2,
  ScanLine,
  IndianRupee,
  Pill,
  Shirt,
  Laptop,
  Star,
  PhoneCall,
  FileText,
  Calculator,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const painPoints = [
  {
    icon: FileText,
    title: 'Hand-written bills?',
    desc: 'Slow, error-prone, and impossible to track. You lose money on missed items and wrong totals.',
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    icon: Calculator,
    title: 'GST giving you headaches?',
    desc: 'Manual GST calculation means mistakes, penalties, and hours wasted every month on returns.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Package,
    title: 'No idea what\'s in stock?',
    desc: 'Running out of items without knowing. Over-ordering what you already have. Money stuck in dead stock.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
]

const howItWorks = [
  {
    step: '01',
    title: 'Create your account',
    desc: 'Sign up with your phone number. Enter your store name and address. Takes 2 minutes.',
    icon: Zap,
    accent: 'from-blue-600 to-blue-500',
  },
  {
    step: '02',
    title: 'Add your products',
    desc: 'Type them in, scan barcodes, or import from Excel. GST rates auto-fill from HSN codes.',
    icon: ShoppingCart,
    accent: 'from-emerald-600 to-emerald-500',
  },
  {
    step: '03',
    title: 'Start billing!',
    desc: 'That\'s it. Open the POS, start scanning, accept payments (cash, UPI, card), print receipts.',
    icon: Receipt,
    accent: 'from-orange-500 to-orange-400',
  },
]

const bentoFeatures = [
  {
    icon: Receipt,
    title: 'GST Billing',
    description: 'Auto GST calculation with HSN codes. GSTR-1 & GSTR-3B exports in one click. E-invoice generation for B2B sales.',
    size: 'large',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-600 text-white',
    accent: 'bg-blue-600',
    tags: ['GSTR-1', 'GSTR-3B', 'E-Invoice', 'HSN'],
    stat: { value: '5%', label: 'GST rates auto-mapped' },
  },
  {
    icon: Package,
    title: 'Smart Stock',
    description: 'Know exactly what you have. Low stock alerts, batch & expiry tracking, stock transfers between locations.',
    size: 'small',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-600 text-white',
    accent: 'bg-emerald-600',
    tags: ['Alerts', 'Batch', 'Expiry'],
    stat: null,
  },
  {
    icon: CreditCard,
    title: 'UPI + Card + Cash',
    description: 'Accept every payment mode. Split payments, credit/udhar tracking, and partial payments.',
    size: 'small',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconBg: 'bg-orange-600 text-white',
    accent: 'bg-orange-600',
    tags: ['UPI QR', 'Udhar', 'Split'],
    stat: null,
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    description: 'Bill even when internet is down. Auto-syncs when you\'re back online. Never lose a sale.',
    size: 'tall',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    iconBg: 'bg-cyan-600 text-white',
    accent: 'bg-cyan-600',
    tags: ['Auto-sync', 'No data loss'],
    stat: { value: '100%', label: 'bills saved offline' },
  },
  {
    icon: BarChart2,
    title: 'Sales Reports',
    description: 'Daily, weekly, monthly. By store, by counter, by product. Profit reports, staff performance, and tax summaries.',
    size: 'wide',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-600 text-white',
    accent: 'bg-amber-600',
    tags: ['Profit', 'Staff', 'PDF Export'],
    stat: null,
  },
  {
    icon: Users,
    title: 'Team & Roles',
    description: 'Owner, manager, cashier, inventory staff. Each person sees only what they need.',
    size: 'small',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-600 text-white',
    accent: 'bg-rose-600',
    tags: ['Owner', 'Cashier', 'Staff'],
    stat: null,
  },
  {
    icon: Store,
    title: 'Multi-Store',
    description: 'One dashboard for all your stores. Real-time sync, stock transfers, and consolidated reports.',
    size: 'small',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    iconBg: 'bg-indigo-600 text-white',
    accent: 'bg-indigo-600',
    tags: ['Sync', 'Transfer'],
    stat: null,
  },
  {
    icon: Smartphone,
    title: 'Touch POS',
    description: 'Built for iPad, Android tablets, and touch screens. No expensive hardware needed.',
    size: 'small',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-600 text-white',
    accent: 'bg-violet-600',
    tags: ['iPad', 'Android', 'Tablet'],
    stat: null,
  },
]

const industries = [
  {
    icon: ShoppingCart,
    title: 'Kirana & Grocery',
    features: ['Loose item billing by weight', 'Fast barcode scanning', 'Low stock alerts', 'Daily sales tracking'],
    accent: 'border-emerald-200 bg-emerald-50/50',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Laptop,
    title: 'Electronics',
    features: ['Serial number tracking', 'Warranty management', 'Repair & service bills', 'Installment payments'],
    accent: 'border-blue-200 bg-blue-50/50',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Pill,
    title: 'Pharmacy',
    features: ['Batch & expiry tracking', 'Compliance-ready bills', 'Prescription linking', 'Drug schedule alerts'],
    accent: 'border-orange-200 bg-orange-50/50',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Shirt,
    title: 'Clothing & Fashion',
    features: ['Size & color variants', 'Return & exchange flow', 'Customer fitting notes', 'Season-wise reports'],
    accent: 'border-rose-200 bg-rose-50/50',
    iconBg: 'bg-rose-100 text-rose-600',
  },
]

const plans = [
  {
    name: 'Launch',
    price: '₹999',
    period: '/month',
    description: 'For your first store',
    features: ['1 Store', '3 Users', '1 Counter', 'GST Billing & Returns', 'Basic Reports', 'Email Support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Grow',
    price: '₹2,499',
    period: '/month',
    description: 'For growing businesses',
    features: ['3 Stores', '10 Users', '5 Counters', 'Advanced Stock & Alerts', 'Full Reports + PDF Export', 'Priority Support', 'E-Invoicing', 'API Access'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Scale',
    price: 'Custom',
    period: '',
    description: 'For franchises & chains',
    features: ['Unlimited Stores', 'Unlimited Users', 'Unlimited Counters', 'White-label Option', 'Dedicated Manager', 'Custom Integration', 'SLA Guarantee'],
    cta: 'Contact Sales',
    popular: false,
  },
]

const testimonials = [
  {
    name: 'Rajesh Sharma',
    role: 'Electronics Store, Chennai',
    text: 'We switched from Tally to Ezvento. Billing is 3x faster and my staff learned it in one day. The GST reports alone save me 4 hours every month.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Pharmacy, Ahmedabad',
    text: 'Expiry tracking was our biggest headache. Now Ezvento alerts me before stock expires. I haven\'t lost a single batch since we started.',
    rating: 5,
  },
  {
    name: 'Mohammed Khan',
    role: 'Kirana Store, Lucknow',
    text: 'I run my shop from a tablet. No computer needed. My wife manages the billing when I\'m away. It just works — even when the WiFi doesn\'t.',
    rating: 5,
  },
]

const trustStats = [
  { value: '10+', label: 'States across India' },
  { value: '50K+', label: 'Bills generated daily' },
  { value: '99.9%', label: 'Uptime guaranteed' },
  { value: '<10 min', label: 'Average setup time' },
]

const faqs = [
  {
    q: 'How long does setup take?',
    a: 'Most stores are up and running in under 10 minutes. Create your account, add your store name and address, and start billing. You can add products later or import from Excel.',
  },
  {
    q: 'Is GST compliance automatic?',
    a: 'Yes. Ezvento automatically calculates GST based on your product HSN codes. You can export GSTR-1 and GSTR-3B reports in one click. E-invoices are generated for B2B sales automatically.',
  },
  {
    q: 'Can I use it on my tablet or phone?',
    a: 'Absolutely. The POS works beautifully on iPad, Android tablets, and any touchscreen device. No expensive POS hardware needed — just a device and a printer.',
  },
  {
    q: 'What happens if internet goes down?',
    a: 'Ezvento works offline. You can keep billing, scanning barcodes, and printing receipts. When your internet comes back, everything syncs automatically. No sale is ever lost.',
  },
  {
    q: 'What happens after the free trial?',
    a: 'You get 14 days free, no credit card required. After that, pick a plan that fits your business. Your data is safe — if you don\'t subscribe, data is kept for 30 days before deletion.',
  },
  {
    q: 'Can I track credit (udhar) sales?',
    a: 'Yes. Link a sale to a customer as credit. See all outstanding balances in one place. Send payment reminders. Record partial payments. Full credit ledger for every customer.',
  },
  {
    q: 'Do I need special hardware?',
    a: 'No. Ezvento works on any device with a browser. For printing, any thermal receipt printer connected via USB or network will work. Barcode scanners plug in directly.',
  },
  {
    q: 'Can I manage multiple stores?',
    a: 'Yes. The Grow plan supports 3 stores, and Scale supports unlimited. See all stores from one dashboard, transfer stock between locations, and get consolidated reports.',
  },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function POSMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Glow behind mockup */}
      <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-emerald-500/10 to-orange-500/10 rounded-3xl blur-2xl" />

      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-xs font-medium text-slate-500">Ezvento POS — Sharma Electronics</span>
          </div>
        </div>

        {/* POS content */}
        <div className="p-4 space-y-3">
          {/* Search bar */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
            <ScanLine className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-400">Scan barcode or search product...</span>
          </div>

          {/* Bill items */}
          <div className="space-y-2">
            {[
              { name: 'Samsung Galaxy Buds', qty: 1, price: '₹2,999', gst: '18%' },
              { name: 'USB-C Cable 1m', qty: 2, price: '₹299', gst: '18%' },
              { name: 'Power Bank 10000mAh', qty: 1, price: '₹899', gst: '18%' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.qty} x {item.price} &middot; GST {item.gst}</p>
                </div>
                <p className="font-semibold text-slate-900 ml-4 whitespace-nowrap">₹{(parseInt(item.price.replace('₹', '').replace(',', '')) * item.qty).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>₹4,497</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST (18%)</span>
              <span>₹809</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 text-base pt-1.5 border-t border-slate-200">
              <span>Total</span>
              <span>₹5,306</span>
            </div>
          </div>

          {/* Payment buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Cash', icon: IndianRupee },
              { label: 'UPI', icon: Smartphone },
              { label: 'Card', icon: CreditCard },
            ].map((m) => (
              <button key={m.label} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors cursor-pointer">
                <m.icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>

          {/* Pay button */}
          <button className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
            Collect ₹5,306
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl bg-white border border-slate-200 overflow-hidden transition-shadow hover:shadow-md"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
          >
            <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
            <ChevronDown
              className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              >
                <p className="px-5 pb-5 text-slate-600 leading-relaxed">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-72 h-full bg-white shadow-2xl p-6 lg:hidden"
          >
            <div className="flex justify-end mb-8">
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {['Features', 'Pricing', 'FAQ'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={onClose}
                  className="px-4 py-3 text-base font-medium text-slate-700 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {item}
                </a>
              ))}
              <div className="border-t border-slate-200 pt-4 mt-4 space-y-3">
                <Link href="/login" onClick={onClose}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/signup" onClick={onClose}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started Free</Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Navigation ── */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="fixed top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/50"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <img src="/logo.svg" alt="Ezvento" className="h-8" />
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {['Features', 'Pricing', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100/80 transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="hidden sm:block">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                Get Started Free
              </Button>
            </Link>
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
          </div>
        </div>
      </motion.header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-white pt-16">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 80, 0], y: [0, -40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 -left-20 w-[700px] h-[700px] bg-blue-600/30 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], x: [0, -40, 0], y: [0, 60, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute -bottom-40 -right-20 w-[500px] h-[500px] bg-orange-500/25 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], x: [0, 60, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
            className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-400/15 rounded-full blur-[80px]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(37,99,235,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Built for Indian retailers</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]"
              >
                Your shop deserves{' '}
                <span className="bg-gradient-to-r from-blue-700 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                  better than pen &amp; paper
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed max-w-lg"
              >
                GST-ready POS &amp; billing software that works on any device. Track stock, manage credit, and see your whole business in one place. Sets up in 10 minutes.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all text-base h-13"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-13">
                    See How It Works
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
                {[
                  { icon: Check, text: 'No credit card required' },
                  { icon: Clock, text: '14-day free trial' },
                  { icon: Shield, text: 'GST compliant' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-1.5">
                    <item.icon className="h-4 w-4 text-emerald-500" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — POS Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="relative lg:pl-8"
            >
              <POSMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <section className="border-y border-slate-200 bg-slate-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Sound familiar?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Running a shop shouldn&apos;t mean wrestling with paperwork at midnight.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {painPoints.map((point, i) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`rounded-2xl ${point.bg} border border-slate-200 p-6 sm:p-8`}
              >
                <div className={`inline-flex items-center justify-center rounded-xl ${point.bg} mb-4`}>
                  <point.icon className={`h-8 w-8 ${point.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{point.title}</h3>
                <p className="text-slate-600 leading-relaxed">{point.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-center mt-10"
          >
            <p className="text-lg font-medium text-blue-600">
              Ezvento fixes all of this.{' '}
              <a href="#features" className="underline underline-offset-4 hover:text-blue-700 transition-colors">
                See how
              </a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              Setup in 10 minutes
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Up and running before your morning chai
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No training, no consultants, no expensive hardware. Just sign up and start billing.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center"
              >
                {/* Step number */}
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.accent} shadow-lg`}>
                  <step.icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-2 block">Step {step.step}</span>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>

                {/* Connector line (hidden on mobile, last item) */}
                {i < howItWorks.length - 1 && (
                  <div className="hidden sm:block absolute top-8 left-[calc(50%+48px)] w-[calc(100%-96px)] h-px bg-gradient-to-r from-slate-300 to-slate-200" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything your shop needs
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              One app for billing, stock, payments, reports, and team management. No juggling five different tools.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-4 md:grid-flow-dense auto-rows-[160px]">
            {bentoFeatures.map((feature, index) => {
              const sizeClasses = {
                large: 'md:col-span-2 md:row-span-2',
                wide: 'md:col-span-2 md:row-span-1',
                tall: 'md:col-span-1 md:row-span-2',
                small: 'md:col-span-1 md:row-span-1',
              }[feature.size]

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.06, ease: [0.32, 0.72, 0, 1] as const }}
                  whileHover={{ y: -4 }}
                  className={`
                    group relative overflow-hidden rounded-2xl ${feature.bg} border ${feature.border} p-5
                    hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col
                    ${sizeClasses}
                  `}
                >
                  {/* Accent bar at top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${feature.accent} rounded-t-2xl`} />

                  <div className="relative h-full flex flex-col">
                    {/* Icon */}
                    <div className={`inline-flex items-center justify-center rounded-xl ${feature.iconBg} mb-3 shrink-0 shadow-sm ${feature.size === 'large' ? 'h-14 w-14' : 'h-10 w-10'}`}>
                      <feature.icon className={`${feature.size === 'large' ? 'h-7 w-7' : 'h-5 w-5'}`} />
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className={`font-semibold text-slate-900 mb-1 ${feature.size === 'large' ? 'text-xl' : feature.size === 'wide' ? 'text-lg' : 'text-base'}`}>
                        {feature.title}
                      </h3>
                      <p className={`text-slate-600 leading-relaxed ${feature.size === 'large' ? 'text-sm' : 'text-xs'}`}>
                        {feature.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {feature.tags.map((tag) => (
                        <span key={tag} className="inline-block px-2 py-0.5 rounded-md bg-white/80 text-[10px] font-medium text-slate-600 border border-slate-200/60">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stat highlight for large/tall cards */}
                    {feature.stat && (
                      <div className="mt-auto pt-3 border-t border-slate-200/50">
                        <p className="text-lg font-bold text-slate-900">{feature.stat.value}</p>
                        <p className="text-xs text-slate-500">{feature.stat.label}</p>
                      </div>
                    )}

                    {/* Feature tag for large/wide/tall cards */}
                    {(feature.size === 'large' || feature.size === 'wide' || feature.size === 'tall') && (
                      <div className="mt-auto pt-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {feature.tags?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Industry Solutions ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
              Industry Ready
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Fits your kind of shop
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Ezvento adapts to your industry. Preset fields, workflows, and reports — ready from day one.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {industries.map((ind, i) => (
              <motion.div
                key={ind.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl border p-6 transition-all duration-300 ${ind.accent}`}
              >
                <div className={`inline-flex items-center justify-center rounded-xl ${ind.iconBg} mb-4`}>
                  <ind.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-900 text-lg mb-3">{ind.title}</h3>
                <ul className="space-y-2">
                  {ind.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Retailers love Ezvento</h2>
            <p className="text-lg text-slate-400">Hear from shop owners who made the switch</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-slate-800/60 border border-slate-700 p-6"
              >
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed mb-4 text-sm">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              { icon: Shield, text: 'GST compliant from day one' },
              { icon: TrendingUp, text: 'Real-time multi-store sync' },
              { icon: Clock, text: 'Setup in under 10 minutes' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700 px-4 py-3">
                <item.icon className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="text-sm text-slate-300">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-lg text-slate-600">Start free. Upgrade when you&apos;re ready. No hidden fees, no surprises.</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className={`
                  relative rounded-2xl p-7 sm:p-8 transition-shadow duration-300
                  ${plan.popular
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 lg:scale-105 ring-2 ring-blue-500'
                    : 'bg-white border border-slate-200 hover:shadow-xl'
                  }
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white border-0 px-3 py-1">Most Popular</Badge>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className={`text-lg font-semibold mb-1 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ml-1 ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-blue-600' : 'bg-blue-100'}`}>
                        <Check className={`h-3 w-3 ${plan.popular ? 'text-white' : 'text-blue-600'}`} />
                      </div>
                      <span className={`text-sm ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup">
                  <Button
                    className={`w-full cursor-pointer ${
                      plan.popular
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 bg-slate-200 text-slate-700 hover:bg-slate-200">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Common questions
            </h2>
          </motion.div>

          <FAQAccordion />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 p-10 sm:p-14 text-center text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full"
              />
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to run your shop the smart way?
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Join retailers across India who bill faster, track stock smarter, and sleep easier with Ezvento. Free for 14 days.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 px-8 h-13 shadow-lg cursor-pointer">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href={`mailto:${SALES_EMAIL}`}>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-13 cursor-pointer">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Talk to Sales
                  </Button>
                </a>
              </div>
              <p className="text-sm text-blue-200 mt-5">No credit card required &middot; Setup in 10 minutes &middot; Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center mb-4">
                <img src="/logo.svg" alt="Ezvento" className="h-7" />
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Simple, powerful POS &amp; billing software built for Indian retailers.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Product</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'Pricing', href: '#pricing' },
                  { label: 'Industries', href: '#industries' },
                  { label: 'Offline POS', href: '#features' },
                ].map((item) => (
                  <li key={item.label}>
                    <a href={item.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Company</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Support', href: '/support' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'Privacy', href: '/privacy' },
                  { label: 'Terms', href: '/terms' },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 text-sm">Get in touch</h4>
              <ul className="space-y-2">
                <li>
                  <a href={`mailto:${SALES_EMAIL}`} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                    {SALES_EMAIL}
                  </a>
                </li>
                <li className="text-sm text-slate-500">Made in India</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              &copy; 2026 Ezvento. Built for Indian retailers.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}