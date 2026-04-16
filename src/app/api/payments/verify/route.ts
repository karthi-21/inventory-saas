import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/payments/verify
 * Legacy Razorpay webhook — now redirects to Dodo webhook
 * Kept for backward compatibility during migration
 */
export async function POST(_request: NextRequest) {
  // Dodo Payments webhooks are handled by /api/payments/dodo-webhook
  // This endpoint is kept as a redirect for any legacy Razorpay webhooks
  return NextResponse.json({ 
    error: 'This endpoint is deprecated. Payment webhooks are now handled by /api/payments/dodo-webhook',
    redirect: '/api/payments/dodo-webhook'
  }, { status: 410 })
}
