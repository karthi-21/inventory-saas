'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Send,
  Loader2,
  TrendingUp,
  Users,
  IndianRupee,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface OutstandingCustomer {
  id: string
  firstName: string
  lastName?: string | null
  phone: string
  email?: string | null
  creditBalance: number
  totalOutstanding: number
  oldestInvoiceDate: string | null
  daysOverdue: number
  invoiceCount: number
  agingBucket: string
  store: { id: string; name: string } | null
  lastFollowUp: { createdAt: string; type: string; notes: string | null } | null
  invoices: Array<{
    invoiceNumber: string
    date: string
    amount: number
    totalAmount: number
    status: string
  }>
}

interface AgingBucket {
  label: string
  color: string
  total: number
  customers: number
}

interface OutstandingData {
  outstanding: OutstandingCustomer[]
  agingBuckets: {
    current: AgingBucket
    aging31_60: AgingBucket
    aging61_90: AgingBucket
    overdue: AgingBucket
  }
  totalOutstanding: number
  totalCustomers: number
}

interface FollowUpForm {
  type: string
  notes: string
  nextDate: string
}

export default function OutstandingCustomersPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('oldest')
  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<OutstandingCustomer | null>(null)
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false)
  const [showReminderPreview, setShowReminderPreview] = useState<OutstandingCustomer | null>(null)
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>({ type: 'CALL', notes: '', nextDate: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<OutstandingData>({
    queryKey: ['outstanding-customers', sortBy, search],
    queryFn: async () => {
      const params = new URLSearchParams({ sortBy })
      if (search) params.set('search', search)
      const res = await fetch(`/api/reports/outstanding?${params}`)
      if (!res.ok) throw new Error('Failed to fetch outstanding customers')
      return res.json().then((d: { data: OutstandingData }) => d.data)
    },
  })

  const sendReminder = useMutation({
    mutationFn: async (customerId: string) => {
      setSendingReminder(customerId)
      const res = await fetch(`/api/customers/${customerId}/send-reminder`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to send reminder')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Reminder email sent!')
      queryClient.invalidateQueries({ queryKey: ['outstanding-customers'] })
      setShowReminderPreview(null)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to send reminder')
    },
    onSettled: () => setSendingReminder(null),
  })

  const logFollowUp = useMutation({
    mutationFn: async ({ customerId, form }: { customerId: string; form: FollowUpForm }) => {
      const res = await fetch(`/api/customers/${customerId}/followups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to log follow-up')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Follow-up logged')
      queryClient.invalidateQueries({ queryKey: ['outstanding-customers'] })
      setShowFollowUpDialog(false)
      setFollowUpForm({ type: 'CALL', notes: '', nextDate: '' })
    },
    onError: () => toast.error('Failed to log follow-up'),
  })

  const getAgingColor = (bucket: string) => {
    switch (bucket) {
      case 'current': return 'bg-green-100 text-green-800 border-green-200'
      case 'aging31_60': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'aging61_90': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAgingLabel = (bucket: string) => {
    switch (bucket) {
      case 'current': return '0–30 days'
      case 'aging31_60': return '31–60 days'
      case 'aging61_90': return '61–90 days'
      case 'overdue': return '90+ days'
      default: return bucket
    }
  }

  const generateWhatsAppLink = (customer: OutstandingCustomer) => {
    const phone = customer.phone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`
    const message = `Dear ${customer.firstName}, you have an outstanding balance of ₹${customer.totalOutstanding.toLocaleString('en-IN')} at ${customer.store?.name || 'our store'}. Please arrange payment at your earliest convenience. Thank you!`
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  const outstanding = data?.outstanding ?? []
  const agingBuckets = data?.agingBuckets

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Outstanding Payments</h1>
          <p className="text-sm text-muted-foreground">Customers with unpaid credit balances</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Total Outstanding</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data?.totalOutstanding ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Customers</span>
            </div>
            <p className="text-2xl font-bold">{data?.totalCustomers ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Oldest Unpaid</span>
            </div>
            <p className="text-2xl font-bold">{outstanding[0] ? `${outstanding[0].daysOverdue}d` : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Over 90 Days</span>
            </div>
            <p className="text-2xl font-bold">{agingBuckets?.overdue.customers ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Buckets */}
      {agingBuckets && (
        <div className="grid gap-3 md:grid-cols-4">
          {Object.entries(agingBuckets).map(([key, bucket]) => (
            <div key={key} className={`rounded-lg border p-3 ${getAgingColor(key)}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{bucket.label}</span>
                <Badge variant="outline" className={getAgingColor(key)}>{bucket.customers}</Badge>
              </div>
              <p className="mt-1 text-lg font-bold">{formatCurrency(bucket.total)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="balance">Highest Balance</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Outstanding Customers Table */}
      <Card>
        <CardHeader><CardTitle>Outstanding Customers</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : outstanding.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No outstanding payments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>Bills</TableHead>
                  <TableHead>Aging</TableHead>
                  <TableHead>Last Follow-up</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstanding.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <button onClick={() => setSelectedCustomer(c)} className="font-medium text-indigo-600 hover:underline">
                        {c.firstName} {c.lastName}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{c.phone}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(c.totalOutstanding)}</TableCell>
                    <TableCell>{c.daysOverdue} days</TableCell>
                    <TableCell>{c.invoiceCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getAgingColor(c.agingBucket)}>
                        {getAgingLabel(c.agingBucket)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.lastFollowUp
                        ? `${c.lastFollowUp.type.replace('_', ' ')} — ${new Date(c.lastFollowUp.createdAt).toLocaleDateString('en-IN')}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.email && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowReminderPreview(c)}
                            disabled={sendingReminder === c.id}
                            title="Send email reminder"
                          >
                            {sendingReminder === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => window.open(generateWhatsAppLink(c), '_blank')} title="Open WhatsApp">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedCustomer(c); setShowFollowUpDialog(true); setFollowUpForm({ type: 'CALL', notes: '', nextDate: '' }) }} title="Log follow-up">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer && !showFollowUpDialog} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</DialogTitle>
            <DialogDescription>Outstanding payment details</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Phone:</span> {selectedCustomer.phone}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedCustomer.email || '—'}</div>
                <div><span className="text-muted-foreground">Store:</span> {selectedCustomer.store?.name || '—'}</div>
                <div><span className="text-muted-foreground">Overdue:</span> {selectedCustomer.daysOverdue} days</div>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-sm text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(selectedCustomer.totalOutstanding)}</p>
              </div>
              <div>
                <h4 className="mb-2 font-medium">Unpaid Bills</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.invoices.map((inv) => (
                      <TableRow key={inv.invoiceNumber}>
                        <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-sm">{inv.date}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(inv.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reminder Preview Dialog */}
      <Dialog open={!!showReminderPreview} onOpenChange={(open) => !open && setShowReminderPreview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>Review and send the reminder email</DialogDescription>
          </DialogHeader>
          {showReminderPreview && (
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-50 p-3">
                <p className="font-medium">{showReminderPreview.firstName} {showReminderPreview.lastName}</p>
                <p className="text-sm text-muted-foreground">{showReminderPreview.email}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Subject:</p>
                <p className="font-medium">Payment Reminder — Outstanding {formatCurrency(showReminderPreview.totalOutstanding)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">The email will include:</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  <li>Customer name and store name</li>
                  <li>Total outstanding: {formatCurrency(showReminderPreview.totalOutstanding)}</li>
                  <li>{showReminderPreview.invoiceCount} unpaid bill(s) breakdown</li>
                  <li>Store contact information</li>
                </ul>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>This will be recorded as a follow-up on the customer&apos;s history.</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderPreview(null)}>Cancel</Button>
            <Button onClick={() => showReminderPreview && sendReminder.mutate(showReminderPreview.id)} disabled={sendReminder.isPending}>
              {sendReminder.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Follow-up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Follow-up</DialogTitle>
            <DialogDescription>Record a follow-up interaction with {selectedCustomer?.firstName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Type</Label>
              <Select value={followUpForm.type} onValueChange={(v) => v && setFollowUpForm({ ...followUpForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">Phone Call</SelectItem>
                  <SelectItem value="VISIT">In-Person Visit</SelectItem>
                  <SelectItem value="EMAIL_SENT">Email Sent</SelectItem>
                  <SelectItem value="WHATSAPP_LINK">WhatsApp Message</SelectItem>
                  <SelectItem value="MANUAL">Manual Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Notes</Label>
              <Input
                value={followUpForm.notes}
                onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
                placeholder="What was discussed? Any commitments made?"
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm font-medium">Next Follow-up Date</Label>
              <Input
                type="date"
                value={followUpForm.nextDate}
                onChange={(e) => setFollowUpForm({ ...followUpForm, nextDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowUpDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedCustomer && logFollowUp.mutate({ customerId: selectedCustomer.id, form: followUpForm })}
              disabled={logFollowUp.isPending}
            >
              {logFollowUp.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { className?: string }) {
  return <label className={className} {...props}>{children}</label>
}