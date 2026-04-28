import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  sendEmail,
  invoiceReceiptEmail,
  paymentReminderEmail,
  lowStockAlertEmail,
  welcomeEmail,
  subscriptionConfirmationEmail,
  userInvitationEmail,
} from '@/lib/emails'

type EmailTemplate =
  | 'welcome'
  | 'invoice-receipt'
  | 'payment-reminder'
  | 'low-stock-alert'
  | 'subscription-confirmation'
  | 'user-invitation'

/**
 * POST /api/emails/send
 * Sends transactional emails via Resend
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { template, to, data } = body

    if (!template || !to) {
      return NextResponse.json({ error: 'Missing required fields: template, to' }, { status: 400 })
    }

    let html: string
    let subject: string

    switch (template as EmailTemplate) {
      case 'welcome':
        html = welcomeEmail(data)
        subject = `Welcome to Ezvento, ${data.userName}!`
        break
      case 'invoice-receipt':
        html = invoiceReceiptEmail(data)
        subject = `Receipt for ${data.invoiceNumber}`
        break
      case 'payment-reminder':
        html = paymentReminderEmail(data)
        subject = `Payment Reminder — Outstanding Balance: ₹${data.totalOutstanding}`
        break
      case 'low-stock-alert':
        html = lowStockAlertEmail(data)
        subject = `Low Stock Alert — ${data.items?.length || 0} items below reorder level`
        break
      case 'subscription-confirmation':
        html = subscriptionConfirmationEmail(data)
        subject = `Subscription Active — ${data.planName} Plan`
        break
      case 'user-invitation':
        html = userInvitationEmail(data)
        subject = `${data.inviterName} invited you to ${data.storeName}`
        break
      default:
        return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 })
    }

    // Send email
    const result = await sendEmail({ to, subject, html })

    // Log to email log table
    const dbUser = await prisma.user.findFirst({
      where: { email: user.email },
      select: { tenantId: true }
    })

    if (dbUser?.tenantId) {
      await prisma.emailLog.create({
        data: {
          tenantId: dbUser.tenantId,
          to: Array.isArray(to) ? to.join(', ') : to,
          template,
          subject,
          status: result.error ? 'FAILED' : 'SENT',
          resendId: result.id || undefined,
          error: result.error || undefined,
        }
      }).catch(() => {
        // Non-blocking — log failure shouldn't break email sending
      })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}

/**
 * GET /api/emails/send — Not allowed
 */
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
