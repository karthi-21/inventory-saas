/**
 * Centralized plan configuration for Ezvento
 * Single source of truth for Launch / Grow / Scale plans
 */

export const PLANS = {
  launch: {
    id: 'launch' as const,
    name: 'Launch',
    price: 999,
    priceDisplay: '₹999',
    period: '/month',
    description: 'Perfect for a single store',
    features: ['1 Store', '3 Users', 'GST Billing', 'Stock Tracking', 'Email Support'],
    highlight: false,
  },
  grow: {
    id: 'grow' as const,
    name: 'Grow',
    price: 2499,
    priceDisplay: '₹2,499',
    period: '/month',
    description: 'Growing retail businesses',
    features: [
      '3 Stores',
      '10 Users',
      'Full Stock',
      'Multi-Payment',
      'Customer Management',
      'Reports & Export',
      'Priority Support',
    ],
    highlight: true,
  },
  scale: {
    id: 'scale' as const,
    name: 'Scale',
    price: 0,
    priceDisplay: 'Custom',
    period: '',
    description: 'Franchises & large operations',
    features: [
      'Unlimited Stores',
      'Unlimited Users',
      'Custom Roles',
      'API Access',
      'White-label',
      'Dedicated Support',
    ],
    highlight: false,
  },
} as const

export type PlanKey = keyof typeof PLANS

/** Array of plan entries for easy iteration */
export const PLAN_ENTRIES = Object.entries(PLANS) as [
  PlanKey,
  (typeof PLANS)[PlanKey],
][]
