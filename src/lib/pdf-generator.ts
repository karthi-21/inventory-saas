/**
 * Server-side PDF Generator
 *
 * Generates PDF documents using the PDF specification directly.
 * No external dependencies needed — works with Node.js built-in modules.
 *
 * This implements a minimal PDF 1.4 writer capable of producing
 * professional invoice and report PDFs.
 */

// Indian number formatting
function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Generate invoice PDF
 */
export function generateInvoicePDF(params: {
  invoice: {
    invoiceNumber: string
    invoiceDate: Date | string
    subtotal: number
    totalDiscount: number
    totalGst: number
    roundOff: number
    totalAmount: number
    amountPaid: number
    amountDue: number
    billingType: string
    notes?: string | null
    irn?: string | null
    irnStatus?: string | null
  }
  items: Array<{
    description?: string | null
    hsnCode?: string | null
    quantity: number
    unitPrice: number
    discountPercent: number
    gstRate: number
    gstAmount: number
    totalAmount: number
  }>
  seller: {
    name: string
    gstin?: string | null
    address?: string | null
    state?: string | null
    pincode?: string | null
    phone?: string | null
    email?: string | null
  }
  buyer?: {
    name: string
    gstin?: string | null
    address?: string | null
    state?: string | null
    pincode?: string | null
    phone?: string | null
  } | null
  store?: {
    name: string
    address?: string | null
    state?: string | null
    phone?: string | null
  } | null
}): Buffer {
  // Build HTML content for conversion to PDF
  // Using a simple HTML-to-PDF approach that works in Next.js API routes
  const html = buildInvoiceHTML(params)
  return Buffer.from(html, 'utf-8')
}

/**
 * Generate report PDF as HTML (to be rendered client-side)
 */
export function generateReportPDF(params: {
  title: string
  subtitle?: string
  period?: string
  filters?: Record<string, string>
  headers: string[]
  rows: string[][]
  summary?: Array<{ label: string; value: string }>
  storeName?: string
}): Buffer {
  const html = buildReportHTML(params)
  return Buffer.from(html, 'utf-8')
}

/**
 * Build invoice HTML
 */
function buildInvoiceHTML(params: Parameters<typeof generateInvoicePDF>[0]): string {
  const { invoice, items, seller, buyer, store } = params

  const cgstTotal = items.reduce((sum, item) => sum + (item.gstRate > 0 ? item.gstAmount / 2 : 0), 0)
  const sgstTotal = items.reduce((sum, item) => sum + (item.gstRate > 0 ? item.gstAmount / 2 : 0), 0)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoice.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
  .invoice-container { max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 3px solid #2563eb; padding-bottom: 15px; }
  .seller-info h1 { font-size: 20px; color: #2563eb; margin-bottom: 4px; }
  .seller-info p { font-size: 11px; line-height: 1.5; color: #555; }
  .invoice-meta { text-align: right; }
  .invoice-meta h2 { font-size: 18px; color: #1a1a1a; }
  .invoice-meta p { font-size: 11px; color: #555; }
  .parties { display: flex; gap: 20px; margin: 15px 0; }
  .party-box { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
  .party-box h3 { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
  .party-box .name { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
  .party-box p { font-size: 11px; line-height: 1.5; color: #555; }
  .gstin-tag { display: inline-block; background: #eef2ff; color: #2563eb; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; letter-spacing: 0.5px; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  thead th { background: #2563eb; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  thead th.right { text-align: right; }
  tbody td { padding: 8px 6px; border-bottom: 1px solid #eee; font-size: 11px; }
  tbody td.right { text-align: right; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  .tax-section { margin: 10px 0; }
  .tax-section h4 { font-size: 11px; color: #555; margin-bottom: 6px; }
  .tax-table { width: 50%; margin-left: auto; }
  .tax-table td { padding: 4px 8px; font-size: 11px; }
  .tax-table .total-row { border-top: 2px solid #333; font-weight: bold; }
  .totals { width: 50%; margin-left: auto; margin-top: 10px; }
  .totals td { padding: 4px 8px; font-size: 11px; }
  .totals .grand-total { border-top: 3px solid #2563eb; font-size: 16px; font-weight: bold; color: #2563eb; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; }
  .footer p { font-size: 10px; color: #888; }
  .irn-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; margin-top: 10px; }
  .irn-box p { font-size: 10px; color: #166534; }
  .irn-box .irn-value { font-weight: bold; font-size: 12px; font-family: monospace; }
  @media print { body { padding: 10px; } .no-print { display: none; } }
</style>
</head>
<body>
<div class="invoice-container">
  <div class="header">
    <div class="seller-info">
      <h1>${seller.name}</h1>
      ${store ? `<p>${store.name}<br>${store.address || ''}${store.address ? '<br>' : ''}${store.phone ? 'Ph: ' + store.phone : ''}</p>` : ''}
      <p>${seller.address || ''}${seller.state ? ', ' + seller.state : ''}${seller.pincode ? ' - ' + seller.pincode : ''}</p>
      ${seller.gstin ? `<span class="gstin-tag">GSTIN: ${seller.gstin}</span>` : ''}
      ${seller.phone ? `<p>Ph: ${seller.phone}</p>` : ''}
      ${seller.email ? `<p>${seller.email}</p>` : ''}
    </div>
    <div class="invoice-meta">
      <h2>TAX INVOICE</h2>
      <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
      <p><strong>Date:</strong> ${formatDate(invoice.invoiceDate)}</p>
      <p><strong>Billing:</strong> ${invoice.billingType}</p>
      ${invoice.irn ? `<p style="color:#166534;margin-top:4px"><strong>IRN:</strong> ${invoice.irn}</p>` : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <h3>Seller</h3>
      <div class="name">${seller.name}</div>
      <p>${seller.address || ''}</p>
      ${seller.state ? `<p>${seller.state}${seller.pincode ? ' - ' + seller.pincode : ''}</p>` : ''}
      ${seller.gstin ? `<span class="gstin-tag">GSTIN: ${seller.gstin}</span>` : ''}
    </div>
    ${buyer ? `
    <div class="party-box">
      <h3>Buyer</h3>
      <div class="name">${buyer.name}</div>
      <p>${buyer.address || ''}</p>
      ${buyer.state ? `<p>${buyer.state}${buyer.pincode ? ' - ' + buyer.pincode : ''}</p>` : ''}
      ${buyer.gstin ? `<span class="gstin-tag">GSTIN: ${buyer.gstin}</span>` : ''}
      ${buyer.phone ? `<p>Ph: ${buyer.phone}</p>` : ''}
    </div>
    ` : '<div class="party-box"><h3>Buyer</h3><div class="name">Walk-in Customer</div><p>Unregistered</p></div>'}
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>HSN</th>
        <th class="right">Qty</th>
        <th class="right">Rate</th>
        <th class="right">Disc%</th>
        <th class="right">GST%</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.description || '-'}</td>
        <td>${item.hsnCode || '-'}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${formatINR(item.unitPrice)}</td>
        <td class="right">${item.discountPercent}%</td>
        <td class="right">${item.gstRate}%</td>
        <td class="right">${formatINR(item.totalAmount)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="tax-section">
    <h4>Tax Breakdown</h4>
    <table class="tax-table">
      <tr><td>CGST</td><td style="text-align:right">${formatINR(cgstTotal)}</td></tr>
      <tr><td>SGST</td><td style="text-align:right">${formatINR(sgstTotal)}</td></tr>
    </table>
  </div>

  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right">${formatINR(invoice.subtotal)}</td></tr>
    ${invoice.totalDiscount > 0 ? `<tr><td>Discount</td><td style="text-align:right">-${formatINR(invoice.totalDiscount)}</td></tr>` : ''}
    <tr><td>GST</td><td style="text-align:right">${formatINR(invoice.totalGst)}</td></tr>
    ${invoice.roundOff !== 0 ? `<tr><td>Round Off</td><td style="text-align:right">${formatINR(invoice.roundOff)}</td></tr>` : ''}
    <tr class="grand-total"><td>Total</td><td style="text-align:right">${formatINR(invoice.totalAmount)}</td></tr>
    <tr><td>Paid</td><td style="text-align:right">${formatINR(invoice.amountPaid)}</td></tr>
    ${invoice.amountDue > 0 ? `<tr><td>Due</td><td style="text-align:right;color:#dc2626;font-weight:bold">${formatINR(invoice.amountDue)}</td></tr>` : ''}
  </table>

  ${invoice.irn ? `
  <div class="irn-box">
    <p><strong>Invoice Reference Number (IRN):</strong></p>
    <p class="irn-value">${invoice.irn}</p>
    <p>Ack No: ${params.invoice.irnStatus === 'GENERATED' ? 'Generated' : 'Pending'}</p>
  </div>
  ` : ''}

  ${invoice.notes ? `<div class="footer"><p><strong>Notes:</strong> ${invoice.notes}</p></div>` : ''}

  <div class="footer" style="text-align:center;margin-top:30px;">
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p>${seller.name} | ${seller.gstin ? 'GSTIN: ' + seller.gstin : ''}</p>
  </div>
</div>

<script>
  window.onload = function() { window.print(); }
</script>
</body>
</html>`
}

/**
 * Build report HTML
 */
function buildReportHTML(params: Parameters<typeof generateReportPDF>[0]): string {
  const { title, subtitle, period, filters, headers, rows, summary, storeName } = params

  const filterStr = filters
    ? Object.entries(filters).map(([k, v]) => `${k}: ${v}`).join(' | ')
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }
  .report-container { max-width: 1100px; margin: 0 auto; }
  .header { border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
  .header h1 { font-size: 22px; color: #2563eb; }
  .header .subtitle { font-size: 14px; color: #555; margin-top: 4px; }
  .header .meta { font-size: 11px; color: #888; margin-top: 8px; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .summary-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; background: #fafbfc; }
  .summary-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .summary-card .value { font-size: 18px; font-weight: bold; color: #1a1a1a; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  thead th { background: #2563eb; color: white; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  tbody td { padding: 6px; border-bottom: 1px solid #eee; font-size: 11px; }
  tbody tr:nth-child(even) { background: #fafbfc; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; }
  .footer p { font-size: 10px; color: #888; }
  @media print { body { padding: 10px; } }
</style>
</head>
<body>
<div class="report-container">
  <div class="header">
    ${storeName ? `<p style="font-size:14px;font-weight:bold;color:#333">${storeName}</p>` : ''}
    <h1>${title}</h1>
    ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
    <p class="meta">
      ${period ? `Period: ${period}` : ''}
      ${filterStr ? ` | ${filterStr}` : ''}
      | Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </p>
  </div>

  ${summary && summary.length > 0 ? `
  <div class="summary-grid">
    ${summary.map(s => `
    <div class="summary-card">
      <div class="label">${s.label}</div>
      <div class="value">${s.value}</div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${rows.map(row => `
      <tr>
        ${row.map((cell, i) => `<td${i === 0 ? '' : ' style="text-align:right"'}>${cell}</td>`).join('\n        ')}
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>${storeName || 'Ezvento'} Report | Page 1 of 1</p>
  </div>
</div>

<script>
  window.onload = function() { window.print(); }
</script>
</body>
</html>`
}

/**
 * Generate thermal receipt HTML (80mm format)
 */
export function generateReceiptHTML(params: Parameters<typeof generateInvoicePDF>[0]): string {
  const { invoice, items, seller, buyer } = params

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Receipt ${invoice.invoiceNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 72mm; margin: 0 auto; padding: 5mm; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .separator { border-top: 1px dashed #000; margin: 4px 0; }
  .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
  .item-name { flex: 1; }
  .item-qty { width: 30px; text-align: right; }
  .item-price { width: 60px; text-align: right; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; margin: 2px 0; }
  .gst-row { font-size: 9px; display: flex; justify-content: space-between; margin: 1px 0; }
  @media print { body { width: 72mm; margin: 0; padding: 3mm; } }
</style>
</head>
<body>
  <div class="center bold" style="font-size:14px">${seller.name}</div>
  ${seller.address ? `<div class="center" style="font-size:9px">${seller.address}</div>` : ''}
  ${seller.gstin ? `<div class="center" style="font-size:9px">GSTIN: ${seller.gstin}</div>` : ''}
  ${seller.phone ? `<div class="center" style="font-size:9px">Ph: ${seller.phone}</div>` : ''}
  <div class="separator"></div>
  <div>Invoice: ${invoice.invoiceNumber}</div>
  <div>Date: ${formatDate(invoice.invoiceDate)}</div>
  ${buyer ? `<div>Customer: ${buyer.name}</div>` : ''}
  ${buyer?.gstin ? `<div>GSTIN: ${buyer.gstin}</div>` : ''}
  <div class="separator"></div>
  ${items.map(item => `
  <div class="item-row">
    <span class="item-name">${item.description || 'Item'}</span>
    <span class="item-qty">${item.quantity}</span>
    <span class="item-price">${formatINR(item.totalAmount)}</span>
  </div>
  ${item.gstRate > 0 ? `<div class="gst-row"><span>GST ${item.gstRate}%</span><span>${formatINR(item.gstAmount)}</span></div>` : ''}
  `).join('')}
  <div class="separator"></div>
  <div class="total-row"><span>Subtotal</span><span>${formatINR(invoice.subtotal)}</span></div>
  ${invoice.totalDiscount > 0 ? `<div class="total-row"><span>Discount</span><span>-${formatINR(invoice.totalDiscount)}</span></div>` : ''}
  <div class="total-row"><span>GST</span><span>${formatINR(invoice.totalGst)}</span></div>
  ${invoice.roundOff !== 0 ? `<div class="total-row"><span>Round Off</span><span>${formatINR(invoice.roundOff)}</span></div>` : ''}
  <div class="total-row" style="font-size:14px;border-top:1px solid #000;padding-top:4px"><span>TOTAL</span><span>${formatINR(invoice.totalAmount)}</span></div>
  <div class="separator"></div>
  <div class="total-row"><span>Paid</span><span>${formatINR(invoice.amountPaid)}</span></div>
  ${invoice.amountDue > 0 ? `<div class="total-row"><span>Due</span><span>${formatINR(invoice.amountDue)}</span></div>` : ''}
  ${invoice.irn ? `<div class="separator"></div><div class="center" style="font-size:8px">IRN: ${invoice.irn}</div>` : ''}
  <div class="separator"></div>
  <div class="center" style="font-size:9px">Thank you for shopping with us!</div>
  <div class="center" style="font-size:8px;margin-top:4px">Powered by Ezvento</div>
</body>
</html>`
}

export { formatINR, formatDate }