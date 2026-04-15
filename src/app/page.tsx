'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Store,
  ArrowRight,
  Check,
  Star,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  Users,
  Receipt,
  Package,
  BarChart3,
  Smartphone,
  Play,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

// Animation variants following emilkowal-animations skill
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as const }
  }
}

const heroFeatures = [
  { icon: Zap, text: 'Setup in 10 minutes', color: '#10B981' },
  { icon: Shield, text: 'GST Compliant', color: '#6366F1' },
  { icon: Clock, text: '99.9% Uptime', color: '#8B5CF6' },
]

const bentoFeatures = [
  {
    icon: Store,
    title: 'Multi-Store',
    description: 'Manage multiple locations from one dashboard. Real-time sync across all stores.',
    size: 'large',
    color: 'from-indigo-500/20 to-violet-500/20',
    iconBg: 'bg-indigo-500/10 text-indigo-600',
  },
  {
    icon: Receipt,
    title: 'GST Billing',
    description: 'Auto GST calculation with HSN codes and multi-rate support',
    size: 'small',
    color: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: Package,
    title: 'Inventory',
    description: 'Track stock & expiry dates with low stock alerts',
    size: 'small',
    color: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-amber-500/10 text-amber-600',
  },
  {
    icon: Smartphone,
    title: 'Touch POS',
    description: 'iPad & Android optimized for fast billing',
    size: 'tall',
    color: 'from-cyan-500/20 to-sky-500/20',
    iconBg: 'bg-cyan-500/10 text-cyan-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Sales reports & insights',
    size: 'wide',
    color: 'from-violet-500/20 to-purple-500/20',
    iconBg: 'bg-violet-500/10 text-violet-600',
  },
  {
    icon: Users,
    title: 'Team',
    description: 'Custom roles & permissions',
    size: 'small',
    color: 'from-rose-500/20 to-pink-500/20',
    iconBg: 'bg-rose-500/10 text-rose-600',
  },
]

const plans = [
  {
    name: 'Launch',
    price: '₹999',
    period: '/month',
    description: 'Perfect for a single store',
    features: ['1 Store', '3 Users', 'GST Billing', 'Basic Reports', 'Email Support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Grow',
    price: '₹2,499',
    period: '/month',
    description: 'For growing businesses',
    features: ['3 Stores', '10 Users', 'Advanced Inventory', 'Priority Support', 'API Access'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Scale',
    price: 'Custom',
    period: '',
    description: 'For franchises & chains',
    features: ['Unlimited Stores', 'Unlimited Users', 'White-label', 'Dedicated Manager', 'Custom Integration'],
    cta: 'Contact Sales',
    popular: false,
  },
]

const testimonials = [
  {
    quote: "Set up my electronics store in 15 minutes. The GST billing feature alone saved me hours every month.",
    author: "Rajesh Kumar",
    business: "Sharma Electronics, Chennai",
    rating: 5,
  },
  {
    quote: "Managing 3 grocery outlets from one dashboard. Stock alerts have saved us thousands in expired goods.",
    author: "Priya Patel",
    business: "FreshMart Supermarket, Ahmedabad",
    rating: 5,
  },
  {
    quote: "The POS is so fast our billing queue reduced by half. Staff learned it in one day without training.",
    author: "Mohammed Ali",
    business: "Fresh Zone, Hyderabad",
    rating: 5,
  },
]

const faqs = [
  {
    q: "How long does setup take?",
    a: "Most stores are up and running in under 10 minutes. Just create an account, add your store details, and start billing immediately.",
  },
  {
    q: "Is GST compliance automatic?",
    a: "Yes! OmniBIZ automatically calculates GST based on your products. You can export GSTR-1 and GSTR-3B reports in one click.",
  },
  {
    q: "Can I use it on my tablet?",
    a: "Absolutely. The POS works beautifully on iPad, Android tablets, and any touchscreen device. No special hardware needed.",
  },
  {
    q: "What happens after the trial?",
    a: "Your data is preserved for 30 days. Subscribe anytime to continue. If you don't subscribe, data is automatically deleted after 30 days.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="fixed top-0 z-50 w-full backdrop-blur-xl bg-white/80 border-b border-slate-200/50"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">OmniBIZ</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'Pricing', 'Solutions'].map((item) => (
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
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section with Aurora Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
        {/* Aurora Background - Layered properly */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient orbs - higher opacity for visibility */}
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              x: [0, 100, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 w-[800px] h-[800px] bg-indigo-500/40 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, -50, 0],
              y: [0, 100, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-40 -right-20 w-[600px] h-[600px] bg-violet-500/40 rounded-full blur-[80px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.4, 1],
              x: [0, 80, 0],
              y: [0, -80, 0]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-400/30 rounded-full blur-[90px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.5, 1],
              x: [0, -60, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 8 }}
            className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-pink-400/25 rounded-full blur-[70px]"
          />

          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm mb-8">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">Now with AI-powered insights</span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-8"
            >
              Run your store{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                like a pro
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The all-in-one POS and billing software built for Indian retailers.
              GST-compliant, multi-store ready, and unbelievably simple to use.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all text-base h-12"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 h-12">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              {heroFeatures.map((feature) => (
                <div key={feature.text} className="flex items-center gap-2">
                  <feature.icon className="h-4 w-4" style={{ color: feature.color }} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-slate-300 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-slate-400 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
              Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Powerful features that work together seamlessly. No complicated setup, no expensive hardware.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-4 md:grid-flow-dense auto-rows-[160px]">
            {bentoFeatures.map((feature, index) => {
              const sizeClasses = {
                large: 'md:col-span-2 md:row-span-2',
                wide: 'md:col-span-2 md:row-span-1',
                tall: 'md:col-span-1 md:row-span-2',
                small: 'md:col-span-1 md:row-span-1'
              }[feature.size]

              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] as const }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`
                    group relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5
                    hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer flex flex-col
                    ${sizeClasses}
                  `}
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative h-full flex flex-col">
                    <div className={`inline-flex items-center justify-center rounded-xl ${feature.iconBg} mb-3 ${feature.size === 'large' ? 'h-14 w-14' : 'h-10 w-10'}`}>
                      <feature.icon className={`${feature.size === 'large' ? 'h-7 w-7' : 'h-5 w-5'}`} />
                    </div>

                    <div className="flex-grow">
                      <h3 className={`font-semibold text-slate-900 mb-1 ${feature.size === 'large' ? 'text-xl' : feature.size === 'wide' ? 'text-lg' : 'text-base'}`}>
                        {feature.title}
                      </h3>
                      <p className={`text-slate-600 leading-relaxed ${feature.size === 'large' ? 'text-sm' : 'text-xs'}`}>
                        {feature.description}
                      </p>
                    </div>

                    {(feature.size === 'large' || feature.size === 'wide') && (
                      <div className="mt-auto pt-3 flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Learn more
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Loved by retailers across India</h2>
            <p className="text-lg text-slate-400">Join 500+ businesses already using OmniBIZ</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-slate-800/50 border border-slate-700 p-6 backdrop-blur-sm"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="h-5 w-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-white">{t.author}</p>
                  <p className="text-sm text-slate-400">{t.business}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600">Start free, upgrade when you're ready. No hidden fees.</p>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className={`
                  relative rounded-3xl p-8 transition-shadow
                  ${plan.popular
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 scale-105'
                    : 'bg-white border border-slate-200 hover:shadow-xl'
                  }
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-500 text-white border-0">Most Popular</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-2 ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-slate-400' : 'text-slate-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-900'}`}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={`text-sm ${plan.popular ? 'text-slate-400' : 'text-slate-600'}`}>
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center ${plan.popular ? 'bg-indigo-500' : 'bg-indigo-100'}`}>
                        <Check className={`h-3 w-3 ${plan.popular ? 'text-white' : 'text-indigo-600'}`} />
                      </div>
                      <span className={`text-sm ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup">
                  <Button
                    className={`w-full ${
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

      {/* FAQ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 p-12 text-center text-white relative overflow-hidden"
          >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full"
              />
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to streamline your store?</h2>
              <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
                Join hundreds of retailers who've switched to OmniBIZ. Setup takes 10 minutes, and it's free to try.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-indigo-600 hover:bg-slate-100 px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Talk to Sales
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">OmniBIZ</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-slate-900">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-900">Terms</Link>
              <Link href="/support" className="hover:text-slate-900">Support</Link>
              <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            </div>

            <p className="text-sm text-slate-500">
              © 2026 OmniBIZ. Made for Indian retailers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
