import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, logActivity } from '@/lib/api'

/**
 * GET /api/print/config
 * List all printers for the current tenant
 */
export async function GET() {
  try {
    const { user, error } = await requirePermission('SETTINGS_VIEW', 'VIEW')
    if (error) return error

    const printers = await prisma.printerConfig.findMany({
      where: { tenantId: user.tenantId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ data: printers })
  } catch (error) {
    console.error('Failed to list printers:', error)
    return NextResponse.json({ error: 'Failed to list printers' }, { status: 500 })
  }
}

/**
 * POST /api/print/config
 * Add a new printer
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { name, type, connectionType, ipAddress, port, paperWidth, charactersPerLine, autoCut, cashDrawer, autoPrint } = body

    if (!name || !type || !connectionType) {
      return NextResponse.json({ error: 'Name, type, and connection type are required' }, { status: 400 })
    }

    if (connectionType === 'NETWORK' && !ipAddress) {
      return NextResponse.json({ error: 'IP address is required for network printers' }, { status: 400 })
    }

    // Get the first store for this tenant (printers are store-level in schema)
    const store = await prisma.store.findFirst({ where: { tenantId: user.tenantId } })
    if (!store) {
      return NextResponse.json({ error: 'No store found for this tenant' }, { status: 400 })
    }

    // If this is the first printer, make it default
    const existingCount = await prisma.printerConfig.count({
      where: { tenantId: user.tenantId },
    })

    const printer = await prisma.printerConfig.create({
      data: {
        tenantId: user.tenantId,
        storeId: store.id,
        name,
        type,
        connectionType,
        ipAddress: connectionType === 'NETWORK' ? ipAddress : null,
        port: connectionType === 'NETWORK' ? (port || 9100) : null,
        paperWidth: paperWidth || 80,
        charactersPerLine: charactersPerLine || 48,
        autoCut: autoCut ?? true,
        cashDrawer: cashDrawer ?? false,
        autoPrint: autoPrint ?? false,
        isDefault: existingCount === 0,
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PRINTER_ADDED',
      module: 'Settings',
      entityId: printer.id,
      metadata: { name, type, connectionType },
    })

    return NextResponse.json({ data: printer }, { status: 201 })
  } catch (error) {
    console.error('Failed to add printer:', error)
    return NextResponse.json({ error: 'Failed to add printer' }, { status: 500 })
  }
}

/**
 * PATCH /api/print/config
 * Update a printer (e.g. set as default, toggle settings)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { id, isDefault, autoPrint, autoCut, cashDrawer, name, ipAddress, port, paperWidth, charactersPerLine } = body

    if (!id) {
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 })
    }

    const existing = await prisma.printerConfig.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await prisma.printerConfig.updateMany({
        where: { tenantId: user.tenantId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const printer = await prisma.printerConfig.update({
      where: { id },
      data: {
        ...(isDefault !== undefined && { isDefault }),
        ...(autoPrint !== undefined && { autoPrint }),
        ...(autoCut !== undefined && { autoCut }),
        ...(cashDrawer !== undefined && { cashDrawer }),
        ...(name !== undefined && { name }),
        ...(ipAddress !== undefined && { ipAddress }),
        ...(port !== undefined && { port }),
        ...(paperWidth !== undefined && { paperWidth }),
        ...(charactersPerLine !== undefined && { charactersPerLine }),
      },
    })

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PRINTER_UPDATED',
      module: 'Settings',
      entityId: printer.id,
      metadata: { updates: body },
    })

    return NextResponse.json({ data: printer })
  } catch (error) {
    console.error('Failed to update printer:', error)
    return NextResponse.json({ error: 'Failed to update printer' }, { status: 500 })
  }
}

/**
 * DELETE /api/print/config?id=xxx
 * Remove a printer
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 })
    }

    const existing = await prisma.printerConfig.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

    await prisma.printerConfig.delete({ where: { id } })

    // If deleted printer was default, set another as default
    if (existing.isDefault) {
      const next = await prisma.printerConfig.findFirst({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'asc' },
      })
      if (next) {
        await prisma.printerConfig.update({
          where: { id: next.id },
          data: { isDefault: true },
        })
      }
    }

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'PRINTER_DELETED',
      module: 'Settings',
      entityId: id,
      metadata: { name: existing.name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete printer:', error)
    return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 })
  }
}