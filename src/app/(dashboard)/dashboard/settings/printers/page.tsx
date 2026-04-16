'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Printer, Plus, Trash2, TestTube, Settings } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface Printer {
  id: string
  name: string
  type: string
  connectionType: string
  ipAddress: string | null
  port: number | null
  paperWidth: number
  charactersPerLine: number
  autoCut: boolean
  cashDrawer: boolean
  autoPrint: boolean
  isDefault: boolean
}

export default function PrintersPage() {
  const queryClient = useQueryClient()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [printerToDelete, setPrinterToDelete] = useState<string | null>(null)
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    type: 'THERMAL',
    connectionType: 'USB',
    ipAddress: '',
    port: '9100',
    paperWidth: '80',
    charactersPerLine: '48',
    autoCut: true,
    cashDrawer: false,
    autoPrint: false,
  })

  const { data: printers = [], isLoading } = useQuery<Printer[]>({
    queryKey: ['printers'],
    queryFn: async () => {
      const res = await fetch('/api/print/config')
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
  })

  const addMutation = useMutation({
    mutationFn: async (printer: typeof newPrinter) => {
      const res = await fetch('/api/print/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...printer,
          port: printer.port ? parseInt(printer.port) : null,
          paperWidth: parseInt(printer.paperWidth),
          charactersPerLine: parseInt(printer.charactersPerLine),
        }),
      })
      if (!res.ok) throw new Error('Failed to add printer')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Printer added')
      queryClient.invalidateQueries({ queryKey: ['printers'] })
      setShowAddDialog(false)
      setNewPrinter({
        name: '', type: 'THERMAL', connectionType: 'USB', ipAddress: '', port: '9100',
        paperWidth: '80', charactersPerLine: '48', autoCut: true, cashDrawer: false, autoPrint: false,
      })
    },
    onError: () => toast.error('Failed to add printer'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/print/config?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete printer')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Printer deleted')
      queryClient.invalidateQueries({ queryKey: ['printers'] })
      setShowDeleteDialog(false)
      setPrinterToDelete(null)
    },
    onError: () => toast.error('Failed to delete printer'),
  })

  const testPrintMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/print/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId: id }),
      })
      if (!res.ok) throw new Error('Test print failed')
      return res.json()
    },
    onSuccess: () => toast.success('Test print sent'),
    onError: () => toast.error('Test print failed. Check printer connection.'),
  })

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/print/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      })
      if (!res.ok) throw new Error('Failed to set default printer')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Default printer updated')
      queryClient.invalidateQueries({ queryKey: ['printers'] })
    },
    onError: () => toast.error('Failed to set default printer'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="h-6 w-6" />
            Receipt Printers
          </h1>
          <p className="text-muted-foreground">Configure thermal printers for billing</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />Add Printer
        </Button>
      </div>

      {/* How it works */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>USB Printers:</strong> Connect via Web Serial API (Chrome/Edge only). Click &quot;Connect&quot; when prompted.</p>
              <p><strong>Network Printers:</strong> Connect via IP address and port (works in any browser).</p>
              <p><strong>Auto-Print:</strong> When enabled, receipts print automatically after each sale.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printer List */}
      {printers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Printer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No printers configured</h3>
            <p className="text-muted-foreground mb-4">Add a receipt printer to start printing bills</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />Add Your First Printer
            </Button>
          </CardContent>
        </Card>
      ) : (
        printers.map(printer => (
          <Card key={printer.id} className={printer.isDefault ? 'border-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {printer.name}
                  {printer.isDefault && <Badge variant="default" className="text-xs">Default</Badge>}
                </CardTitle>
                <Badge variant="outline">
                  {printer.connectionType === 'USB' ? 'USB' : 'Network'}
                </Badge>
              </div>
              <CardDescription>
                {printer.connectionType === 'NETWORK' && printer.ipAddress
                  ? `${printer.ipAddress}:${printer.port || 9100}`
                  : 'Web Serial (USB)'}
                {' '} | {printer.paperWidth}mm | {printer.charactersPerLine} chars/line
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Switch checked={printer.autoPrint} disabled />
                  <span>Auto-print</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={printer.autoCut} disabled />
                  <span>Auto cut</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={printer.cashDrawer} disabled />
                  <span>Cash drawer</span>
                </div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => testPrintMutation.mutate(printer.id)}>
                  <TestTube className="h-3 w-3 mr-1" />Test Print
                </Button>
                {!printer.isDefault && (
                  <Button size="sm" variant="outline" onClick={() => setDefaultMutation.mutate(printer.id)}>
                    Set as Default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive ml-auto"
                  onClick={() => { setPrinterToDelete(printer.id); setShowDeleteDialog(true) }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Add Printer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Receipt Printer</DialogTitle>
            <DialogDescription>Configure a thermal printer for printing bills</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Printer Name</Label>
              <Input
                value={newPrinter.name}
                onChange={e => setNewPrinter(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Counter 1 Printer"
              />
            </div>
            <div>
              <Label>Connection Type</Label>
              <Select value={newPrinter.connectionType} onValueChange={v => setNewPrinter(p => ({ ...p, connectionType: v ?? 'USB' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USB">USB (Web Serial)</SelectItem>
                  <SelectItem value="NETWORK">Network (IP/Port)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newPrinter.connectionType === 'NETWORK' && (
              <>
                <div>
                  <Label>IP Address</Label>
                  <Input
                    value={newPrinter.ipAddress}
                    onChange={e => setNewPrinter(p => ({ ...p, ipAddress: e.target.value }))}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label>Port</Label>
                  <Input
                    value={newPrinter.port}
                    onChange={e => setNewPrinter(p => ({ ...p, port: e.target.value }))}
                    placeholder="9100"
                  />
                </div>
              </>
            )}
            <div>
              <Label>Paper Width</Label>
              <Select value={newPrinter.paperWidth} onValueChange={v => setNewPrinter(p => ({ ...p, paperWidth: v ?? '80' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="80">80mm (standard)</SelectItem>
                  <SelectItem value="58">58mm (compact)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={newPrinter.autoPrint} onCheckedChange={v => setNewPrinter(p => ({ ...p, autoPrint: v }))} />
                <Label>Auto-print after each sale</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newPrinter.autoCut} onCheckedChange={v => setNewPrinter(p => ({ ...p, autoCut: v }))} />
                <Label>Auto cut paper</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newPrinter.cashDrawer} onCheckedChange={v => setNewPrinter(p => ({ ...p, cashDrawer: v }))} />
                <Label>Open cash drawer</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(newPrinter)}
              disabled={!newPrinter.name || addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Add Printer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Printer</DialogTitle>
            <DialogDescription>Are you sure you want to remove this printer? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => printerToDelete && deleteMutation.mutate(printerToDelete)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}