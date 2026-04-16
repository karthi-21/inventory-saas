/**
 * PhonePe Payment Gateway Client for OmniBIZ POS
 * 
 * Uses PhonePe PG v2 API with OAuth (Client ID + Client Secret).
 * The v1 API (Salt Key) is deprecated — your dashboard shows
 * "Client ID" and "Client Secret" which is what we use here.
 * 
 * API Docs: https://developer.phonepe.com/v2/docs
 * 
 * Auth Flow:
 *   1. POST /auth/token with Client ID + Client Secret → get access_token
 *   2. Use access_token as Bearer token in all subsequent API calls
 *   3. Token expires in ~30 min — we cache and auto-refresh
 */

import crypto from 'crypto'

const PHONEPE_CLIENT_ID = process.env.PHONEPE_CLIENT_ID || ''
const PHONEPE_CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || ''
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || ''
const PHONEPE_API_URL = process.env.PHONEPE_API_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox'
const PHONEPE_CALLBACK_URL = process.env.PHONEPE_CALLBACK_URL || ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PHONEPE_REDIRECT_URL = process.env.PHONEPE_REDIRECT_URL || ''

// --- v1 backward compat (if you still have Salt Key credentials) ---
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY || ''
const PHONEPE_SALT_INDEX = Number(process.env.PHONEPE_SALT_INDEX || '1')

// OAuth token cache
let tokenCache: { token: string; expiresAt: number } | null = null

export function isPhonePeConfigured(): boolean {
  // v2 (preferred): Client ID + Client Secret
  if (PHONEPE_CLIENT_ID && PHONEPE_CLIENT_SECRET && PHONEPE_MERCHANT_ID) return true
  // v1 (fallback): Salt Key
  if (PHONEPE_SALT_KEY && PHONEPE_MERCHANT_ID) return true
  return false
}

function isV2Auth(): boolean {
  return !!(PHONEPE_CLIENT_ID && PHONEPE_CLIENT_SECRET)
}

/**
 * Get OAuth access token (v2 auth)
 * Caches token for 25 minutes (tokens are valid ~30 min)
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const response = await fetch(`${PHONEPE_API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PHONEPE_CLIENT_ID,
      client_secret: PHONEPE_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`PhonePe auth failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const accessToken = data.access_token || data.token
  const expiresIn = data.expires_in || data.expires || 1800 // default 30 min

  if (!accessToken) {
    throw new Error('PhonePe auth returned empty token')
  }

  // Cache with 5-min buffer
  tokenCache = {
    token: accessToken,
    expiresAt: Date.now() + (expiresIn - 300) * 1000,
  }

  return accessToken
}

/**
 * Make authenticated API call to PhonePe
 * Auto-selects v2 (Bearer) or v1 (X-VERIFY) auth
 */
async function phonePeFetch(path: string, options: RequestInit = {}, payload?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (isV2Auth()) {
    // v2 auth: Bearer token
    const token = await getAccessToken()
    headers['Authorization'] = `Bearer ${token}`
    headers['X-MERCHANT-ID'] = PHONEPE_MERCHANT_ID
  } else {
    // v1 auth: X-VERIFY signature (backward compat)
    const endpoint = path
    const base64Payload = payload ? Buffer.from(payload).toString('base64') : ''
    const hash = crypto
      .createHash('sha256')
      .update(base64Payload + endpoint + PHONEPE_SALT_KEY)
      .digest('hex')
    headers['X-VERIFY'] = `${hash}###${PHONEPE_SALT_INDEX}`
    headers['X-MERCHANT-ID'] = PHONEPE_MERCHANT_ID
  }

  const response = await fetch(`${PHONEPE_API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`PhonePe API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

export interface PhonePePaymentParams {
  amount: number
  invoiceId: string
  merchantUserId: string
  redirectUrl: string
  method: 'UPI_INTENT' | 'UPI_QR'
  merchantVPA?: string
  merchantName?: string
}

export interface PhonePePaymentResponse {
  merchantTransactionId: string
  transactionId: string
  redirectUrl: string
  upiDeepLink?: string
  qrData?: string
}

/**
 * Initiate a PhonePe payment (works with both v1 and v2 auth)
 */
export async function initiatePayment(params: PhonePePaymentParams): Promise<PhonePePaymentResponse> {
  if (!isPhonePeConfigured()) throw new Error('PhonePe is not configured.')

  const merchantTransactionId = `MTX_${params.invoiceId}_${Date.now()}`
  const amountInPaise = Math.round(params.amount * 100)

  const payload = JSON.stringify({
    merchantTransactionId,
    merchantId: PHONEPE_MERCHANT_ID,
    amount: amountInPaise,
    merchantUserId: params.merchantUserId,
    redirectUrl: params.redirectUrl,
    redirectMode: 'REDIRECT',
    callbackUrl: PHONEPE_CALLBACK_URL,
    paymentInstrument: { type: params.method },
    metadata: { invoiceId: params.invoiceId, source: 'omnibiz_pos' },
  })

  if (isV2Auth()) {
    // v2 API: Send payload directly with Bearer token
    const result = await phonePeFetch('/pg/v2/pay', {
      method: 'POST',
      body: payload,
    }, payload)

    const data = result.data || result

    let qrData: string | undefined
    if (params.method === 'UPI_QR' && params.merchantVPA) {
      qrData = generateUPIQrString({
        vpa: params.merchantVPA,
        name: params.merchantName || 'OmniBIZ Store',
        amount: params.amount,
        transactionNote: `Payment for invoice ${params.invoiceId}`,
      })
    }

    return {
      merchantTransactionId,
      transactionId: data.transactionId || data.txnId || '',
      redirectUrl: data.redirectUrl || data.instrumentResponse?.redirectInfo?.url || '',
      upiDeepLink: data.instrumentResponse?.intentUrl,
      qrData,
    }
  } else {
    // v1 API: Base64 encode payload, sign with X-VERIFY
    const endpoint = '/pg/v1/pay'
    const base64Payload = Buffer.from(payload).toString('base64')
    const hash = crypto.createHash('sha256').update(base64Payload + endpoint + PHONEPE_SALT_KEY).digest('hex')
    const xVerify = `${hash}###${PHONEPE_SALT_INDEX}`

    const response = await fetch(`${PHONEPE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
      },
      body: JSON.stringify({ request: base64Payload }),
    })

    if (!response.ok) throw new Error(`PhonePe payment initiation failed: ${response.status}`)

    const result = await response.json()
    const data = result.data || result

    let qrData: string | undefined
    if (params.method === 'UPI_QR' && params.merchantVPA) {
      qrData = generateUPIQrString({
        vpa: params.merchantVPA,
        name: params.merchantName || 'OmniBIZ Store',
        amount: params.amount,
        transactionNote: `Payment for invoice ${params.invoiceId}`,
      })
    }

    return {
      merchantTransactionId,
      transactionId: data.transactionId || data.txnId || '',
      redirectUrl: data.redirectUrl || data.instrumentResponse?.redirectInfo?.url || '',
      upiDeepLink: data.instrumentResponse?.intentUrl,
      qrData,
    }
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(merchantTransactionId: string) {
  if (!isPhonePeConfigured()) throw new Error('PhonePe is not configured.')

  if (isV2Auth()) {
    const result = await phonePeFetch(`/pg/v2/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`)
    const data = result.data || result

    let status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' = 'PENDING'
    if (data.transactionStatus === 'COMPLETED' || data.status === 'SUCCESS') status = 'SUCCESS'
    else if (data.transactionStatus === 'FAILED' || data.status === 'FAILED') status = 'FAILED'
    else if (data.transactionStatus === 'REFUNDED') status = 'REFUNDED'

    return {
      status,
      amount: (data.amount || 0) / 100,
      paymentMethod: data.paymentInstrument?.type || data.paymentMode,
      upiTransactionId: data.upiTransactionId || data.transactionId,
      completedAt: data.transactionDate || data.completedAt,
    }
  } else {
    // v1 fallback
    const endpoint = `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`
    const hash = crypto.createHash('sha256').update(endpoint + PHONEPE_SALT_KEY).digest('hex')
    const xVerify = `${hash}###${PHONEPE_SALT_INDEX}`

    const response = await fetch(`${PHONEPE_API_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'X-VERIFY': xVerify, 'X-MERCHANT-ID': PHONEPE_MERCHANT_ID },
    })

    if (!response.ok) throw new Error(`PhonePe status check failed: ${response.status}`)

    const result = await response.json()
    const data = result.data || result

    let status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' = 'PENDING'
    if (data.transactionStatus === 'COMPLETED' || data.status === 'SUCCESS') status = 'SUCCESS'
    else if (data.transactionStatus === 'FAILED' || data.status === 'FAILED') status = 'FAILED'
    else if (data.transactionStatus === 'REFUNDED') status = 'REFUNDED'

    return {
      status,
      amount: (data.amount || 0) / 100,
      paymentMethod: data.paymentInstrument?.type || data.paymentMode,
      upiTransactionId: data.upiTransactionId || data.transactionId,
      completedAt: data.transactionDate || data.completedAt,
    }
  }
}

/**
 * Initiate a refund
 */
export async function initiateRefund(params: {
  merchantTransactionId: string
  originalTransactionId: string
  amount: number
  reason: string
}) {
  if (!isPhonePeConfigured()) throw new Error('PhonePe is not configured.')

  const refundId = `REF_${params.merchantTransactionId}_${Date.now()}`
  const amountInPaise = Math.round(params.amount * 100)

  const payload = JSON.stringify({
    merchantId: PHONEPE_MERCHANT_ID,
    merchantTransactionId: refundId,
    originalTransactionId: params.originalTransactionId,
    amount: amountInPaise,
    callbackUrl: PHONEPE_CALLBACK_URL,
    reason: params.reason,
  })

  if (isV2Auth()) {
    const result = await phonePeFetch('/pg/v2/refund', { method: 'POST', body: payload }, payload)
    return { refundId, status: result.code || result.data?.status || 'PENDING' }
  } else {
    const endpoint = '/pg/v1/refund'
    const base64Payload = Buffer.from(payload).toString('base64')
    const hash = crypto.createHash('sha256').update(base64Payload + endpoint + PHONEPE_SALT_KEY).digest('hex')
    const xVerify = `${hash}###${PHONEPE_SALT_INDEX}`

    const response = await fetch(`${PHONEPE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify },
      body: payload,
    })

    if (!response.ok) throw new Error(`PhonePe refund failed: ${response.status}`)

    const result = await response.json()
    return { refundId, status: result.code || result.data?.status || 'PENDING' }
  }
}

/**
 * Verify PhonePe webhook signature
 * Works for both v1 and v2 webhooks
 */
export function verifyPhonePeWebhook(payload: string, xVerify: string): boolean {
  // v2 webhooks: verify using Client Secret
  if (PHONEPE_CLIENT_SECRET) {
    const expectedHash = crypto
      .createHmac('sha256', PHONEPE_CLIENT_SECRET)
      .update(payload)
      .digest('hex')
    return xVerify === expectedHash
  }

  // v1 webhooks: verify using Salt Key
  if (PHONEPE_SALT_KEY) {
    const expectedHash = crypto
      .createHash('sha256')
      .update(payload + PHONEPE_SALT_KEY)
      .digest('hex')
    return xVerify === `${expectedHash}###${PHONEPE_SALT_INDEX}`
  }

  return false
}

/**
 * Generate UPI QR code data string
 * Format: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
export function generateUPIQrString(params: {
  vpa: string
  name: string
  amount: number
  transactionNote?: string
}): string {
  const upiParams = new URLSearchParams()
  upiParams.set('pa', params.vpa)
  upiParams.set('pn', params.name)
  upiParams.set('am', params.amount.toFixed(2))
  upiParams.set('cu', 'INR')
  if (params.transactionNote) upiParams.set('tn', params.transactionNote)
  return `upi://pay?${upiParams.toString()}`
}
