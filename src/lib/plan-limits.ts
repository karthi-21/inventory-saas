/**
 * Plan Limits for OmniBIZ Subscriptions
 */

import { TenantPlan } from '@prisma/client'

export interface PlanLimit {
  stores: number; users: number; products: number; locations: number; invoices: number
  reports: boolean; multiPayment: boolean; customerManagement: boolean
  apiAccess: boolean; whiteLabel: boolean; eInvoice: boolean
}

export const PLAN_LIMITS: Record<TenantPlan, PlanLimit> = {
  STARTER: { stores: 1, users: 3, products: -1, locations: 2, invoices: -1, reports: true, multiPayment: false, customerManagement: false, apiAccess: false, whiteLabel: false, eInvoice: false },
  PRO: { stores: 3, users: 10, products: -1, locations: 5, invoices: -1, reports: true, multiPayment: true, customerManagement: true, apiAccess: false, whiteLabel: false, eInvoice: true },
  ENTERPRISE: { stores: -1, users: -1, products: -1, locations: -1, invoices: -1, reports: true, multiPayment: true, customerManagement: true, apiAccess: true, whiteLabel: true, eInvoice: true },
}

export const PLAN_DETAILS: Record<string, { name: string; price: number; priceDisplay: string; period: string; description: string; features: string[]; highlight: boolean }> = {
  launch: { name: 'Launch', price: 999, priceDisplay: '₹999', period: '/month', description: 'Perfect for a single store', features: ['1 Store', '3 Users', 'GST Billing', 'Inventory Tracking', 'Email Support'], highlight: false },
  grow: { name: 'Grow', price: 2499, priceDisplay: '₹2,499', period: '/month', description: 'Growing retail businesses', features: ['3 Stores', '10 Users', 'Full Inventory', 'Multi-Payment', 'Customer Management', 'Reports & Export', 'Priority Support'], highlight: true },
  scale: { name: 'Scale', price: 0, priceDisplay: 'Custom', period: '', description: 'Franchises & large operations', features: ['Unlimited Stores', 'Unlimited Users', 'Custom Roles', 'API Access', 'White-label', 'Dedicated Support'], highlight: false },
}

export function checkLimit(params: { plan: TenantPlan; limitType: 'stores' | 'users' | 'products' | 'locations' | 'invoices'; currentCount: number }): { allowed: boolean; current: number; limit: number; upgradeMessage?: string } {
  const limits = PLAN_LIMITS[params.plan]
  if (!limits) return { allowed: false, current: params.currentCount, limit: 0 }
  const limit = limits[params.limitType] as number
  if (limit === -1) return { allowed: true, current: params.currentCount, limit: -1 }
  const allowed = params.currentCount < limit
  return { allowed, current: params.currentCount, limit, upgradeMessage: !allowed ? `You've reached the ${params.limitType} limit for your plan. Upgrade to add more.` : undefined }
}
