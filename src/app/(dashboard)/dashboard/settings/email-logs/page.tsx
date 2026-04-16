'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface EmailLog {
  id: string
  to: string
  template: string
  subject: string
  status: string
  resendId: string | null
  error: string | null
  createdAt: string
}

const templateLabels: Record<string, string> = {
  invoice_receipt: 'Bill Receipt',
  payment_reminder: 'Payment Reminder',
  low_stock_alert: 'Low Stock Alert',
  subscription_confirmation: 'Subscription',
  user_invitation: 'Team Invite',
  welcome: 'Welcome',
}

const statusColors: Record<string, string> = {
  SENT: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  QUEUED: 'bg-blue-100 text-blue-800',
}

export default function EmailLogsPage() {
  const [templateFilter, setTemplateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data, isLoading, refetch, isFetching } = useQuery<{ data: EmailLog[]; total: number }>({
    queryKey: ['email-logs', templateFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (templateFilter !== 'all') params.set('template', templateFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/emails/logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch email logs')
      return res.json()
    },
  })

  const logs = data?.data || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Activity
          </h1>
          <p className="text-muted-foreground">View sent emails and delivery status</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={templateFilter} onValueChange={v => setTemplateFilter(v ?? 'all')}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All templates" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All templates</SelectItem>
            <SelectItem value="invoice_receipt">Bill Receipts</SelectItem>
            <SelectItem value="payment_reminder">Payment Reminders</SelectItem>
            <SelectItem value="low_stock_alert">Low Stock Alerts</SelectItem>
            <SelectItem value="welcome">Welcome</SelectItem>
            <SelectItem value="user_invitation">Team Invites</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v ?? 'all')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No emails sent yet</h3>
            <p className="text-muted-foreground">Emails will appear here when they are sent</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{data?.total || 0} emails</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{log.subject}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {templateLabels[log.template] || log.template}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">To: {log.to}</p>
                    {log.error && (
                      <p className="text-sm text-red-600 mt-1">Error: {log.error}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <Badge className={`shrink-0 ${statusColors[log.status] || 'bg-gray-100 text-gray-800'}`}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}