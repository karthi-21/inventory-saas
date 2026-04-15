'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React from 'react'
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
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
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

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/stores', icon: Store, label: 'Stores' },
  { href: '/dashboard/inventory', icon: Package, label: 'Inventory' },
  { href: '/dashboard/billing', icon: Receipt, label: 'Billing' },
  { href: '/dashboard/customers', icon: Users, label: 'Customers' },
  { href: '/dashboard/vendors', icon: ShoppingCart, label: 'Vendors' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
]

const bottomNavItems = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
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
          <span className="font-bold text-lg">OmniBIZ</span>
          <p className="text-xs text-muted-foreground">Pro Plan</p>
        </div>
      </div>

      {/* Store Selector */}
      <div className="mb-4 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full justify-start gap-2 border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors px-3 py-2 gap-2">
            <Store className="h-4 w-4" />
            <span className="flex-1 truncate text-left">Chennai Showroom</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>Chennai Showroom</DropdownMenuItem>
            <DropdownMenuItem>Coimbatore Branch</DropdownMenuItem>
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
                  RK
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">Rajesh K.</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">Rajesh Kumar</p>
                <p className="text-xs text-muted-foreground">rajesh@sharmaelectronics.in</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Avatar className="mr-2 h-6 w-6">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">RK</AvatarFallback>
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

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
