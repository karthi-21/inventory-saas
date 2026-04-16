import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, userInvitationEmail } from '@/lib/emails'

/**
 * POST /api/emails/invite
 * Send team member invitation email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role, storeName, inviterName, signupUrl } = body as {
      email: string
      role: string
      storeName: string
      inviterName: string
      signupUrl: string
    }

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 })
    }

    const result = await sendEmail({
      to: email,
      subject: `You're invited to join ${storeName} on Ezvento`,
      html: userInvitationEmail({
        inviteeName: email.split('@')[0],
        inviterName,
        storeName,
        role,
        signupUrl,
      }),
      tags: { type: 'user_invitation' },
    })

    return NextResponse.json({ success: !result.error, emailId: result.id, error: result.error })
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}
