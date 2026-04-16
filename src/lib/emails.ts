/**
 * Ezvento Transactional Email System via Resend
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Ezvento <billing@ezvento.karth-21.com>'
const REPLY_TO = process.env.RESEND_REPLY_TO || 'support@ezvento.karth-21.com'

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
  tags?: Record<string, string>
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string; error?: string }> {
  try {
    const { data, error } = await resend.emails.send({
      from: params.from || FROM_EMAIL,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo || REPLY_TO,
      tags: params.tags ? Object.entries(params.tags).map(([key, value]) => ({ name: key, value })) : undefined,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { id: '', error: error.message }
    }
    return { id: data?.id || '' }
  } catch (err) {
    console.error('Email sending failed:', err)
    return { id: '', error: String(err) }
  }
}

// ==========================================
// Email Templates
// ==========================================

export function welcomeEmail(p: { userName: string; storeName: string; dashboardUrl: string }): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:40px 0"><h1 style="color:#2563EB;margin:0">Welcome to Ezvento! 🎉</h1></div>
    <p>Hi ${p.userName},</p>
    <p>Your store <strong>${p.storeName}</strong> is all set up and ready to go!</p>
    <p>Here's what you can do next:</p>
    <ul><li>📋 Add your products and set up inventory</li><li>👥 Create customer profiles</li><li>🧾 Start billing from your POS screen</li><li>📊 View reports and track performance</li></ul>
    <div style="text-align:center;margin:30px 0"><a href="${p.dashboardUrl}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a></div>
    <p style="color:#6B7280;font-size:14px">— The Ezvento Team</p></div>`
}

export function invoiceReceiptEmail(p: {
  customerName: string; invoiceNumber: string; storeName: string; invoiceDate: string
  items: Array<{ description: string; quantity: number; unitPrice: number; gstRate: number; totalAmount: number }>
  subtotal: number; totalGst: number; totalAmount: number; paymentMethod: string; invoiceUrl?: string
}): string {
  const rows = p.items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #E5E7EB">${i.description}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">₹${i.unitPrice.toFixed(2)}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">₹${i.totalAmount.toFixed(2)}</td></tr>`).join('')
  return `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:20px 0;border-bottom:2px solid #2563EB"><h2 style="color:#2563EB;margin:0">🧾 Payment Receipt</h2><p style="color:#6B7280;margin:4px 0">${p.storeName}</p></div>
    <p>Hi ${p.customerName},</p><p>Thank you for your purchase!</p>
    <table style="width:100%;font-size:14px"><tr style="background:#F3F4F6"><td style="padding:8px"><strong>Bill #</strong></td><td style="padding:8px;text-align:right">${p.invoiceNumber}</td></tr><tr><td style="padding:8px"><strong>Date</strong></td><td style="padding:8px;text-align:right">${p.invoiceDate}</td></tr><tr style="background:#F3F4F6"><td style="padding:8px"><strong>Payment</strong></td><td style="padding:8px;text-align:right">${p.paymentMethod}</td></tr></table>
    <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse"><thead><tr style="background:#2563EB;color:white"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:right">Qty</th><th style="padding:8px;text-align:right">Rate</th><th style="padding:8px;text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table>
    <table style="width:100%;font-size:14px"><tr><td style="padding:4px 8px">Subtotal</td><td style="padding:4px 8px;text-align:right">₹${p.subtotal.toFixed(2)}</td></tr><tr><td style="padding:4px 8px">GST</td><td style="padding:4px 8px;text-align:right">₹${p.totalGst.toFixed(2)}</td></tr><tr style="font-weight:bold;font-size:16px;border-top:2px solid #2563EB"><td style="padding:8px">Total</td><td style="padding:8px;text-align:right">₹${p.totalAmount.toFixed(2)}</td></tr></table>
    ${p.invoiceUrl ? `<div style="text-align:center;margin:24px 0"><a href="${p.invoiceUrl}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Full Bill</a></div>` : ''}
    <p style="color:#6B7280;font-size:14px">Thank you for shopping with us!<br>— ${p.storeName}</p></div>`
}

export function paymentReminderEmail(p: {
  customerName: string; storeName: string; totalOutstanding: number; invoiceCount: number
  invoiceBreakdown: Array<{ invoiceNumber: string; date: string; amount: number }>; payLink?: string
}): string {
  const rows = p.invoiceBreakdown.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #E5E7EB">${i.invoiceNumber}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB">${i.date}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">₹${i.amount.toFixed(2)}</td></tr>`).join('')
  return `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:20px 0;border-bottom:2px solid #F59E0B"><h2 style="color:#F59E0B;margin:0">Payment Reminder 💛</h2></div>
    <p>Dear ${p.customerName},</p>
    <p>You have an outstanding balance of <strong style="color:#DC2626">₹${p.totalOutstanding.toFixed(2)}</strong> at <strong>${p.storeName}</strong>.</p>
    <p>Outstanding bills (${p.invoiceCount}):</p>
    <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse"><thead><tr style="background:#FEF3C7"><th style="padding:8px;text-align:left">Bill #</th><th style="padding:8px;text-align:left">Date</th><th style="padding:8px;text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr style="font-weight:bold;border-top:2px solid #F59E0B"><td style="padding:8px" colspan="2">Total Outstanding</td><td style="padding:8px;text-align:right">₹${p.totalOutstanding.toFixed(2)}</td></tr></tfoot></table>
    ${p.payLink ? `<div style="text-align:center;margin:24px 0"><a href="${p.payLink}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Pay Now</a></div>` : ''}
    <p style="color:#6B7280;font-size:14px">— ${p.storeName}</p></div>`
}

export function lowStockAlertEmail(p: { storeName: string; items: Array<{ name: string; sku: string; currentStock: number; reorderLevel: number }>; inventoryUrl: string }): string {
  const rows = p.items.map(i => `<tr><td style="padding:8px;border-bottom:1px solid #E5E7EB">${i.name}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB">${i.sku}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;color:${i.currentStock===0?'#DC2626':'#F59E0B'}">${i.currentStock}</td><td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right">${i.reorderLevel}</td></tr>`).join('')
  return `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:20px 0;border-bottom:2px solid #F59E0B"><h2 style="color:#F59E0B;margin:0">⚠️ Low Stock Alert</h2></div>
    <p>Low stock items at <strong>${p.storeName}</strong>:</p>
    <table style="width:100%;margin:16px 0;font-size:14px;border-collapse:collapse"><thead><tr style="background:#FEF3C7"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px;text-align:left">Product Code</th><th style="padding:8px;text-align:right">Stock</th><th style="padding:8px;text-align:right">Reorder</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="text-align:center;margin:24px 0"><a href="${p.inventoryUrl}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Stock</a></div>
    <p style="color:#6B7280;font-size:14px">— Ezvento Stock Alerts</p></div>`
}

export function subscriptionConfirmationEmail(p: { userName: string; planName: string; price: string; nextBillingDate: string; dashboardUrl: string }): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:30px 0;background:linear-gradient(135deg,#2563EB 0%,#EA580C 100%);border-radius:8px 8px 0 0"><h1 style="color:white;margin:0">✅ Subscription Active!</h1></div>
    <div style="padding:20px"><p>Hi ${p.userName},</p><p>Your <strong>${p.planName}</strong> plan is now active.</p>
    <table style="width:100%;font-size:14px"><tr style="background:#F3F4F6"><td style="padding:12px"><strong>Plan</strong></td><td style="padding:12px;text-align:right">${p.planName}</td></tr><tr><td style="padding:12px"><strong>Price</strong></td><td style="padding:12px;text-align:right">${p.price}/month</td></tr><tr style="background:#F3F4F6"><td style="padding:12px"><strong>Next Billing</strong></td><td style="padding:12px;text-align:right">${p.nextBillingDate}</td></tr></table>
    <div style="text-align:center;margin:24px 0"><a href="${p.dashboardUrl}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a></div>
    <p style="color:#6B7280;font-size:14px">— The Ezvento Team</p></div></div>`
}

export function userInvitationEmail(p: { inviteeName: string; inviterName: string; storeName: string; role: string; signupUrl: string }): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="text-align:center;padding:30px 0;background:linear-gradient(135deg,#2563EB 0%,#EA580C 100%);border-radius:8px 8px 0 0"><h1 style="color:white;margin:0">👋 You're Invited!</h1></div>
    <div style="padding:20px"><p>Hi ${p.inviteeName},</p><p><strong>${p.inviterName}</strong> has invited you to join <strong>${p.storeName}</strong> on Ezvento as a <strong>${p.role}</strong>.</p>
    <div style="text-align:center;margin:24px 0"><a href="${p.signupUrl}" style="background:#2563EB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invitation</a></div>
    <p style="color:#6B7280;font-size:14px">This invitation expires in 7 days.<br>— The Ezvento Team</p></div></div>`
}
