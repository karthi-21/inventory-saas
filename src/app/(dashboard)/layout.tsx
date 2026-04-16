'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Store,
  LayoutDashboard,
  Package,
  Receipt,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  AlertTriangle,
  Info,
  XCircle, // eslint-disable-line @typescript-eslint/no-unused-vars
  UserCog,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button' // eslint-disable-line @typescript-eslint/no-unused-vars
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase/client'
import { usePOSStore } from '@/stores/pos-store'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error'
  createdAt: string
  read: boolean
  actionUrl?: string
}

const allNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
  { href: '/dashboard/stores', icon: Store, label: 'Stores', key: 'stores' },
  { href: '/dashboard/inventory', icon: Package, label: 'Stock', key: 'inventory' },
  { href: '/dashboard/billing', icon: Receipt, label: 'Billing', key: 'billing' },
  { href: '/dashboard/customers', icon: Users, label: 'Customers', key: 'customers' },
  { href: '/dashboard/vendors', icon: ShoppingCart, label: 'Vendors', key: 'vendors' },
  { href: '/dashboard/team', icon: UserCog, label: 'Team', key: 'team' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reports', key: 'reports' },
]

const allBottomNavItems = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', key: 'settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] = useState(false)
  const { currentStoreId, setCurrentStore, setCurrentLocation } = usePOSStore()

  // Fetch user permissions for menu filtering
  const { data: permissionsData } = useQuery<{ menuAccess: Record<string, boolean> }>({
    queryKey: ['user-permissions'],
    queryFn: async () => {
      const res = await fetch('/api/auth/permissions')
      if (!res.ok) return { menuAccess: {} }
      const data = await res.json()
      return data
    },
    staleTime: 5 * 60 * 1000, // Cache permissions for 5 minutes
  })

  const menuAccess = permissionsData?.menuAccess || {}
  const navItems = allNavItems.filter(item => !menuAccess[item.key] && menuAccess[item.key] !== undefined ? false : true)
  const bottomNavItems = allBottomNavItems.filter(item => !menuAccess[item.key] && menuAccess[item.key] !== undefined ? false : true)

  // Fetch user info from Supabase auth session
  const { data: userData } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      return {
        email: user.email ?? '',
        firstName: user.user_metadata?.first_name ?? user.user_metadata?.name?.split(' ')[0] ?? '',
        lastName: user.user_metadata?.last_name ?? user.user_metadata?.name?.split(' ').slice(1).join(' ') ?? '',
      }
    },
  })

  // Fetch stores for the store selector
  const { data: storesData, isLoading: storesLoading } = useQuery<{ id: string; name: string; code: string }[]>({
    queryKey: ['stores'],
    queryFn: async () => {
      const res = await fetch('/api/stores')
      if (!res.ok) throw new Error('Failed to fetch stores')
      const json = await res.json()
      return json.data || []
    },
    retry: 2,
    retryDelay: 1000,
  })
  const stores = useMemo(() => Array.isArray(storesData) ? storesData : [], [storesData])

  // Auto-set current store when stores load and no store is selected or selected store doesn't exist
  // Uses both a synchronous check (to prevent child components from rendering with null storeId)
  // and a useEffect (to properly trigger state update and re-render)
  const _effectiveStoreId = (!currentStoreId && stores.length > 0)
    ? stores[0].id
    : (currentStoreId && stores.length > 0 && !stores.find(s => s.id === currentStoreId))
      ? stores[0].id
      : currentStoreId

  React.useEffect(() => {
    if (stores.length > 0 && !storesLoading) {
      if (!currentStoreId || !stores.find(s => s.id === currentStoreId)) {
        setCurrentStore(stores[0].id)
        setCurrentLocation(null)
      }
    }
  }, [stores, storesLoading, currentStoreId, setCurrentStore, setCurrentLocation])

  // Fetch tenant plan
  const { data: tenantData } = useQuery<{ plan: string }>({
    queryKey: ['tenant-plan'],
    queryFn: async () => {
      const res = await fetch('/api/tenant')
      if (!res.ok) throw new Error('Failed to fetch tenant')
      const json = await res.json()
      return json.tenant || json
    },
    retry: 2,
    retryDelay: 1000,
  })
  const planLabel = tenantData?.plan
    ? tenantData.plan.charAt(0) + tenantData.plan.slice(1).toLowerCase() + ' Plan'
    : 'Free Plan'

  // Fetch subscription status for trial banner
  const { data: subscriptionData } = useQuery<{
    hasActiveSubscription: boolean
    subscription: { status: string; currentPeriodEnd: string; plan: string } | null
  }>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await fetch('/api/payments/subscription-status')
      if (!res.ok) return { hasActiveSubscription: false, subscription: null }
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const hasActiveSubscription = subscriptionData?.hasActiveSubscription ?? true
  const subscription = subscriptionData?.subscription
  const isTrialing = subscription?.status === 'TRIALING'
  const trialEndDate = isTrialing && subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd)
    : null
  const trialDaysLeft = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const trialExpired = isTrialing && trialDaysLeft === 0
  const isPastDue = subscription?.status === 'PAST_DUE'

  // Redirect to payment if trial expired and no active subscription
  React.useEffect(() => {
    if (!subscriptionData) return // Still loading
    if (trialExpired || (!hasActiveSubscription && !isTrialing)) {
      if (pathname !== '/dashboard/billing' && pathname !== '/dashboard/settings') {
        router.push('/payment')
      }
    }
  }, [subscriptionData, trialExpired, hasActiveSubscription, isTrialing, pathname, router])

  // Fetch notifications
  const { data: notificationsData } = useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) return { notifications: [], unreadCount: 0 }
      return res.json()
    },
    refetchInterval: 60000, // Refresh every minute
  })

  const notifications = notificationsData?.notifications || []
  const unreadCount = notificationsData?.unreadCount || 0

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LOW_STOCK':
      case 'EXPIRING_PRODUCTS':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'PENDING_PAYMENTS':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // Check if user needs to complete onboarding
  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const res = await fetch('/api/onboarding/status')
        if (res.ok) {
          const data = await res.json()
          // If user has no existing store and is not already on onboarding page
          if (!data.hasExistingStore && pathname !== '/onboarding') {
            setShouldRedirectToOnboarding(true)
          }
        }
      } catch (e) {
        console.error('Error checking onboarding:', e)
      } finally {
        setIsCheckingOnboarding(false)
      }
    }
    checkOnboarding()
  }, [pathname])

  // Redirect to onboarding if needed
  React.useEffect(() => {
    if (shouldRedirectToOnboarding && !isCheckingOnboarding) {
      router.push('/onboarding')
    }
  }, [shouldRedirectToOnboarding, isCheckingOnboarding, router])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Logout failed:', err)
      window.location.href = '/login'
    } finally {
      setIsLoggingOut(false)
    }
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Store className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg">Ezvento</span>
          <p className="text-xs text-muted-foreground">{planLabel}</p>
        </div>
      </div>

      {/* Store Selector */}
      <div className="mb-4 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full justify-start gap-2 border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors px-3 py-2 gap-2">
            <Store className="h-4 w-4" />
            <span className="flex-1 truncate text-left">
              {storesLoading ? 'Loading...' : stores.length > 0
	                ? (currentStoreId
		            ? stores.find(s => s.id === currentStoreId)?.name ?? stores[0].name
		            : stores[0].name)
	                : 'No stores'}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {Array.isArray(stores) && stores.map((store) => (
              <DropdownMenuItem key={store.id} onClick={() => { setCurrentStore(store.id); setCurrentLocation(null) }}>{store.name}</DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Badge variant="outline" className="mr-2">+</Badge>
              Add Store
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="space-y-1 px-2 pt-4 border-t">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
        <button
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white lg:sticky lg:top-0 lg:self-stretch">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col py-4">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 lg:px-6">
          <Sheet>
            <SheetTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground px-3 py-2 lg:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
          </Sheet>

          <div className="flex-1" />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger className="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground p-2">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-4 min-w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5 font-semibold">Notifications</div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  {notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => {
                        if (notification.actionUrl) {
                          router.push(notification.actionUrl)
                        }
                      }}
                    >
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-primary">
                    View all notifications
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground px-2 py-1.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {userData ? (userData.firstName?.[0] ?? '') + (userData.lastName?.[0] ?? '') : '??'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {userData ? `${userData.firstName} ${userData.lastName?.[0] ?? ''}.` : 'Loading...'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{userData ? `${userData.firstName} ${userData.lastName}` : 'Loading...'}</p>
                <p className="text-xs text-muted-foreground">{userData?.email ?? 'Loading...'}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{userData ? (userData.firstName?.[0] ?? '') + (userData.lastName?.[0] ?? '') : '??'}</AvatarFallback>
                </Avatar>
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Trial / Subscription Banner */}
        {isTrialing && trialDaysLeft > 0 && (
          <div className="bg-primary/10 border-b px-4 py-2 text-center text-sm">
            <span className="font-medium text-primary">{trialDaysLeft} days left</span> in your free trial.
            <Link href="/payment" className="ml-2 font-semibold text-primary underline underline-offset-2">Subscribe now</Link>
          </div>
        )}
        {isTrialing && trialDaysLeft === 0 && (
          <div className="bg-destructive/10 border-b px-4 py-2 text-center text-sm text-destructive font-medium">
            Your free trial has expired. <Link href="/payment" className="underline underline-offset-2">Subscribe now</Link> to continue using Ezvento.
          </div>
        )}
        {isPastDue && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800 font-medium">
            Payment failed — please update your payment method. <Link href="/payment" className="underline underline-offset-2">Update payment</Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 pb-20 lg:pb-6 lg:p-6">{children}</main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-white lg:hidden h-16">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-[60px]">{item.label}</span>
            </Link>
          )
        })}
        <Link
          href="/dashboard/settings"
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 text-xs transition-colors ${
            pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="truncate max-w-[60px]">More</span>
        </Link>
      </nav>
    </div>
  )
}
