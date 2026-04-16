'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from '@/components/ui/select'
import { Shield, Search, Loader2, AlertCircle } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  CANCEL: 'bg-orange-100 text-orange-800',
  VOID: 'bg-orange-100 text-orange-800',
  ADJUST: 'bg-yellow-100 text-yellow-800',
}

interface AuditLog {
  id: string
  action: string
  module: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  createdAt: string
  user?: { firstName: string; lastName: string; email: string }
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')

  const { data, isLoading, error } = useQuery<{ data: AuditLog[]; pagination: { total: number } }>({
    queryKey: ['audit-logs', search, actionFilter, entityFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (actionFilter) params.set('action', actionFilter)
      if (entityFilter) params.set('entityType', entityFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      return res.json()
    },
  })

  const logs = data?.data || []

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">Failed to load audit logs</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Track all system activities</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search actions, modules, entities..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => v && setActionFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-48">
            {actionFilter || 'All Actions'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="DELETE">Delete</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="INVOICE_CREATE">Bill Create</SelectItem>
            <SelectItem value="INVOICE_CANCEL">Bill Cancel</SelectItem>
            <SelectItem value="RETURN_CREATE">Return Create</SelectItem>
            <SelectItem value="STOCK_TRANSFER">Stock Transfer</SelectItem>
            <SelectItem value="SHIFT_OPEN">Shift Open</SelectItem>
            <SelectItem value="SHIFT_CLOSE">Shift Close</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={(v) => v && setEntityFilter(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-48">
            {entityFilter || 'All Entities'}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Entities</SelectItem>
            <SelectItem value="SalesInvoice">Bill</SelectItem>
            <SelectItem value="Customer">Customer</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
            <SelectItem value="InventoryStock">Stock</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Shift">Shift</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Activity Logs
            {data?.pagination && (
              <span className="text-sm font-normal text-muted-foreground">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No activity logs found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user ? `${log.user.firstName} ${log.user.lastName || ''}`.trim() : 'System'}
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.module}</TableCell>
                    <TableCell className="text-sm">
                      {log.entityType || '-'}
                      {log.entityId && (
                        <span className="text-muted-foreground ml-1">({log.entityId.slice(0, 8)}...)</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}