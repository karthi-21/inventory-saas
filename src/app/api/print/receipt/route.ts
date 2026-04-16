import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api'

/**
 * POST /api/print/receipt
 * Generates receipt HTML for browser printing (ESC/POS for v2)
 * Input: invoice data
 * Returns: HTML page formatted for thermal receipt printer
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requirePermission('BILLING_VIEW', 'VIEW')
    if (error) return error

    const body = await request.json()
    const {
      invoiceNumber,
      invoiceDate,
      storeName,
      storeAddress,
      storeGstin,
      customerName,
      customerPhone,
      customerGstin,
      items,
      subtotal,
      totalDiscount,
      totalGst,
      roundOff,
      totalAmount,
      amountPaid,
      amountDue,
      paymentMethod,
      paymentReference,
    } = body

    const html = generateReceiptHTML({
      invoiceNumber,
      invoiceDate,
      storeName,
      storeAddress,
      storeGstin,
      customerName,
      customerPhone,
      customerGstin,
      items,
      subtotal,
      totalDiscount,
      totalGst,
      roundOff,
      totalAmount,
      amountPaid,
      amountDue,
      paymentMethod,
      paymentReference,
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 })
  }
}

interface ReceiptData {
  invoiceNumber: string
  invoiceDate: string
  storeName: string
  storeAddress: string
  storeGstin: string
  customerName: string
  customerPhone?: string
  customerGstin?: string
  items: Array<{
    name: string
    quantity: number
    unitPrice: number
    discountAmount: number
    gstRate: number
    totalAmount: number
  }>
  subtotal: number
  totalDiscount: number
  totalGst: number
  roundOff: number
  totalAmount: number
  amountPaid: number
  amountDue: number
  paymentMethod: string
  paymentReference?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function generateReceiptHTML(data: ReceiptData): string {
  const date = new Date(data.invoiceDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const itemsHTML = data.items
    .map(
      (item) => `
      <tr>
        <td style="text-align:left;padding:4px 8px;">${escapeHtml(item.name)}</td>
        <td style="text-align:center;padding:4px 8px;">${item.quantity}</td>
        <td style="text-align:right;padding:4px 8px;">₹${item.unitPrice.toLocaleString('en-IN')}</td>
        <td style="text-align:right;padding:4px 8px;">₹${item.totalAmount.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 80mm;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th { border-bottom: 1px dashed #000; }
    .divider { border-top: 1px dashed #000; margin: 8px 0; }
    .footer { text-align: center; font-size: 10px; color: #666; margin-top: 16px; }
    @media print {
      body { width: 80mm; margin: 0; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center border-bottom">
    <h2 style="font-size:16px;">${escapeHtml(data.storeName)}</h2>
    <p style="font-size:10px;">${escapeHtml(data.storeAddress)}</p>
    <p style="font-size:10px;">GSTIN: ${data.storeGstin ? escapeHtml(data.storeGstin) : 'N/A'}</p>
  </div>

  <div class="border-bottom" style="padding:8px 0;">
    <p><span class="bold">Bill:</span> ${escapeHtml(data.invoiceNumber)}</p>
    <p><span class="bold">Date:</span> ${date}</p>
    <p><span class="bold">Customer:</span> ${escapeHtml(data.customerName)}</p>
    ${data.customerPhone ? `<p><span class="bold">Phone:</span> ${escapeHtml(data.customerPhone)}</p>` : ''}
    ${data.customerGstin ? `<p><span class="bold">GSTIN:</span> ${escapeHtml(data.customerGstin)}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;padding:4px 8px;">Item</th>
        <th style="text-align:center;padding:4px 8px;">Qty</th>
        <th style="text-align:right;padding:4px 8px;">Rate</th>
        <th style="text-align:right;padding:4px 8px;">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHTML}
    </tbody>
  </table>

  <div class="divider"></div>

  <div>
    <div style="display:flex;justify-content:space-between;padding:2px 0;">
      <span>Subtotal</span><span>₹${data.subtotal.toLocaleString('en-IN')}</span>
    </div>
    ${data.totalDiscount > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:2px 0;color:green;">
      <span>Discount</span><span>-₹${data.totalDiscount.toLocaleString('en-IN')}</span>
    </div>
    ` : ''}
    <div style="display:flex;justify-content:space-between;padding:2px 0;">
      <span>GST</span><span>₹${data.totalGst.toLocaleString('en-IN')}</span>
    </div>
    ${data.roundOff !== 0 ? `
    <div style="display:flex;justify-content:space-between;padding:2px 0;">
      <span>Round Off</span><span>₹${data.roundOff.toLocaleString('en-IN')}</span>
    </div>
    ` : ''}
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;padding:4px 0;font-weight:bold;font-size:14px;">
      <span>TOTAL</span><span>₹${data.totalAmount.toLocaleString('en-IN')}</span>
    </div>
    ${data.amountPaid > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:2px 0;">
      <span>Paid</span><span>₹${data.amountPaid.toLocaleString('en-IN')}</span>
    </div>
    ` : ''}
    ${data.amountDue > 0 ? `
    <div style="display:flex;justify-content:space-between;padding:2px 0;color:red;">
      <span>Due</span><span>₹${data.amountDue.toLocaleString('en-IN')}</span>
    </div>
    ` : ''}
  </div>

  <div class="divider"></div>

  <div>
    <p style="text-align:center;"><span class="bold">Payment:</span> ${escapeHtml(data.paymentMethod)}</p>
    ${data.paymentReference ? `<p style="text-align:center;font-size:10px;">Ref: ${escapeHtml(data.paymentReference)}</p>` : ''}
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Powered by Ezvento</p>
  </div>
</body>
</html>`
}
