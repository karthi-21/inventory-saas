/**
 * Centralized email address configuration for Ezvento
 *
 * For client-side usage (mailto links, UI), use NEXT_PUBLIC_* variants.
 * For server-side usage (Resend API), the non-prefixed variants work too.
 */

const DOMAIN = 'ezvento.karthi-21.com'

export const BILLING_EMAIL =
  process.env.NEXT_PUBLIC_BILLING_EMAIL || process.env.BILLING_EMAIL || `billing@${DOMAIN}`

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || `support@${DOMAIN}`

export const SALES_EMAIL =
  process.env.NEXT_PUBLIC_SALES_EMAIL || process.env.SALES_EMAIL || `sales@${DOMAIN}`

export const LEGAL_EMAIL =
  process.env.NEXT_PUBLIC_LEGAL_EMAIL || process.env.LEGAL_EMAIL || `legal@${DOMAIN}`

export const PRIVACY_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL || process.env.PRIVACY_EMAIL || `privacy@${DOMAIN}`

/** Resend "from" field with display name */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || `Ezvento <${BILLING_EMAIL}>`

export const REPLY_TO =
  process.env.RESEND_REPLY_TO || SUPPORT_EMAIL
