import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/api'

/**
 * POST /api/print/test
 * Send a test print to a specific printer
 * Returns ESC/POS test receipt data that the client can send to the printer
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('SETTINGS_EDIT', 'EDIT')
    if (error) return error

    const body = await request.json()
    const { printerId } = body

    if (!printerId) {
      return NextResponse.json({ error: 'Printer ID is required' }, { status: 400 })
    }

    const printer = await prisma.printerConfig.findFirst({
      where: { id: printerId, tenantId: user.tenantId },
    })

    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 })
    }

    // Return test print instructions that the client-side code will execute
    // The actual printing happens in the browser via Web Serial or WebSocket
    return NextResponse.json({
      success: true,
      printer: {
        id: printer.id,
        name: printer.name,
        connectionType: printer.connectionType,
        ipAddress: printer.ipAddress,
        port: printer.port,
        paperWidth: printer.paperWidth,
        charactersPerLine: printer.charactersPerLine,
        autoCut: printer.autoCut,
        cashDrawer: printer.cashDrawer,
      },
      // Test receipt data for client-side printing
      testData: {
        storeName: 'OmniBIZ Test',
        message: 'Test Print Successful',
        printerName: printer.name,
        date: new Date().toLocaleString('en-IN'),
      },
    })
  } catch (error) {
    console.error('Test print failed:', error)
    return NextResponse.json({ error: 'Test print failed' }, { status: 500 })
  }
}