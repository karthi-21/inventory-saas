import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpRight,
  ArrowDownRight,
  Store,
  Receipt,
  Package,
  TrendingUp,
  IndianRupee,
  Users,
  AlertTriangle,
} from 'lucide-react'

const stats = [
  {
    title: "Today's Sales",
    value: '₹45,230',
    change: '+12.5%',
    changeType: 'up',
    icon: IndianRupee,
  },
  {
    title: 'Invoices',
    value: '38',
    change: '+8',
    changeType: 'up',
    icon: Receipt,
  },
  {
    title: 'New Customers',
    value: '12',
    change: '+3',
    changeType: 'up',
    icon: Users,
  },
  {
    title: 'Low Stock Items',
    value: '7',
    change: '-2',
    changeType: 'down',
    icon: AlertTriangle,
  },
]

const recentSales = [
  { id: 'INV-2026-001', customer: 'Walk-in Customer', amount: '₹2,450', time: '2 mins ago', items: 3 },
  { id: 'INV-2026-002', customer: 'Priya Sharma', amount: '₹8,999', time: '15 mins ago', items: 1 },
  { id: 'INV-2026-003', customer: 'Quick Mart', amount: '₹15,200', time: '32 mins ago', items: 12 },
  { id: 'INV-2026-004', customer: 'Walk-in Customer', amount: '₹890', time: '45 mins ago', items: 2 },
  { id: 'INV-2026-005', customer: 'Anil Reddy', amount: '₹32,500', time: '1 hour ago', items: 5 },
]

const topItems = [
  { name: 'Samsung 43" Smart TV', qty: 12, revenue: '₹2,16,000' },
  { name: 'iPhone 15 Pro (256GB)', qty: 8, revenue: '₹7,99,920' },
  { name: 'LG Front Load Washing Machine', qty: 6, revenue: '₹2,70,000' },
  { name: 'Sony WH-1000XM5 Headphones', qty: 15, revenue: '₹2,24,850' },
  { name: 'MacBook Air M3', qty: 4, revenue: '₹3,99,600' },
]

const alerts = [
  { type: 'warning', message: '4 items below reorder level', href: '/dashboard/inventory?filter=low-stock' },
  { type: 'info', message: '2 invoices awaiting payment', href: '/dashboard/billing?status=pending' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Saturday, 4 April 2026 • Chennai Showroom
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">This Month</Badge>
          <Badge variant="outline">Last Month</Badge>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Card key={i} className={`border-l-4 ${
              alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
            }`}>
              <CardContent className="flex items-center gap-3 p-3">
                <AlertTriangle className={`h-4 w-4 ${
                  alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <span className="text-sm">{alert.message}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {stat.changeType === 'up' ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span className={stat.changeType === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                vs yesterday
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Sales</CardTitle>
              <Badge>Today</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{sale.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.customer} • {sale.items} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{sale.amount}</p>
                    <p className="text-xs text-muted-foreground">{sale.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a href="/dashboard/billing" className="text-sm text-primary hover:underline">
                View all invoices →
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Selling</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.qty} sold</p>
                  </div>
                  <p className="text-sm font-medium text-green-600">{item.revenue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="/dashboard/billing/new"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">New Sale</p>
            <p className="text-sm text-muted-foreground">Start billing</p>
          </div>
        </a>
        <a
          href="/dashboard/inventory"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Add Stock</p>
            <p className="text-sm text-muted-foreground">Purchase entry</p>
          </div>
        </a>
        <a
          href="/dashboard/customers"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Add Customer</p>
            <p className="text-sm text-muted-foreground">New registration</p>
          </div>
        </a>
        <a
          href="/dashboard/reports"
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:bg-card"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600">
            <Store className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-medium">Reports</p>
            <p className="text-sm text-muted-foreground">View analytics</p>
          </div>
        </a>
      </div>
    </div>
  )
}
