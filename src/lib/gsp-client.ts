/**
 * GSP (GST Suvidha Provider) API Client
 *
 * Integrates with NIC e-invoicing API through a GSP.
 * Supports authentication, IRN generation, cancellation, and GSTIN lookup.
 *
 * API Docs: https://einv-apisandbox.nic.in/ (sandbox)
 *           https://einvoice1.gst.gov.in/ (production)
 *
 * Environment variables:
 * - GSP_BASE_URL: GSP API base URL
 * - GSP_CLIENT_ID: GSP client ID
 * - GSP_CLIENT_SECRET: GSP client secret
 * - GSTN_GSTIN: Seller GSTIN
 * GSTN_USERNAME: GSTN portal username
 * GSTN_PASSWORD: GSTN portal password (app key)
 */

// Token cache (in-memory, per-process)
let tokenCache: {
  token: string
  sek: string
  expiresAt: number
} | null = null

interface GSPAuthResponse {
  Status: number
  ErrorDetails?: { ErrorCode: string; ErrorMessage: string }[]
  Data: string // Base64-encoded auth token
  AuthToken?: string
  Sek?: string
}

interface GSPAPIResponse {
  Status: number
  ErrorDetails?: { ErrorCode: string; ErrorMessage: string }[]
  Data?: string
}

export interface IRNResponse {
  Irn: string
  AckNo: number
  AckDt: string
  SignedInvoice: string
  SignedQRCode: string
  Status: string
  EwbNo?: string
  EwbDt?: string
  EwbValidTill?: string
}

export interface IRNCancelResponse {
  Irn: string
  Status: string
  CancelDate: string
}

function getBaseUrl(): string {
  return process.env.GSP_BASE_URL || 'https://einv-apisandbox.nic.in'
}

function getHeaders(authToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'client_id': process.env.GSP_CLIENT_ID || '',
    'client_secret': process.env.GSP_CLIENT_SECRET || '',
    'Gstin': process.env.GSTN_GSTIN || '',
    'user_name': process.env.GSTN_USERNAME || '',
  }
  if (authToken) {
    headers['Authorization'] = authToken
  }
  return headers
}

/**
 * Authenticate with GSTN via GSP and get auth token + SEK
 */
export async function authenticate(): Promise<{ token: string; sek: string }> {
  // Return cached token if still valid (with 5-min buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return { token: tokenCache.token, sek: tokenCache.sek }
  }

  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1.04/auth`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      Action: 'ACCESSTOKEN',
      UserName: process.env.GSTN_USERNAME || '',
      Password: process.env.GSTN_PASSWORD || '',
      AppKey: process.env.GSP_CLIENT_SECRET || '',
    }),
  })

  if (!response.ok) {
    throw new Error(`GSP auth failed: ${response.status} ${response.statusText}`)
  }

  const result: GSPAuthResponse = await response.json()

  if (result.Status !== 1 && result.Status !== 200) {
    const errMsg = result.ErrorDetails?.[0]?.ErrorMessage || 'Unknown auth error'
    throw new Error(`GSP auth error: ${errMsg}`)
  }

  // The response contains AuthToken and Sek (Session Encryption Key)
  const token = result.AuthToken || result.Data || ''
  const sek = result.Sek || ''

  if (!token) {
    throw new Error('GSP auth returned empty token')
  }

  // Cache for 50 minutes (GSTN tokens are valid for 60 min)
  tokenCache = {
    token,
    sek,
    expiresAt: Date.now() + 50 * 60 * 1000,
  }

  return { token, sek }
}

/**
 * Make an authenticated API call to GSTN via GSP
 */
async function apiCall(endpoint: string, payload: unknown): Promise<GSPAPIResponse> {
  const { token } = await authenticate()

  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1.03/${endpoint}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`GSP API call failed: ${response.status} ${response.statusText}`)
  }

  const result: GSPAPIResponse = await response.json()
  return result
}

/**
 * Generate IRN (Invoice Reference Number) by submitting e-invoice JSON
 */
export async function generateIRN(eInvoiceJson: unknown): Promise<IRNResponse> {
  const result = await apiCall('Invoice', eInvoiceJson)

  if (result.Status !== 1 && result.Status !== 200) {
    const errors = result.ErrorDetails || []
    const errMsg = errors.map(e => `${e.ErrorCode}: ${e.ErrorMessage}`).join('; ')
    throw new Error(errMsg || 'IRN generation failed')
  }

  // Parse the response data
  let irnData: IRNResponse
  if (typeof result.Data === 'string') {
    try {
      irnData = JSON.parse(Buffer.from(result.Data, 'base64').toString('utf-8'))
    } catch {
      irnData = JSON.parse(result.Data)
    }
  } else {
    irnData = result.Data as unknown as IRNResponse
  }

  return irnData
}

/**
 * Cancel an existing IRN
 */
export async function cancelIRN(
  irn: string,
  reason: 'DUPLICATE' | 'DATA_ENTRY_MISTAKE' | 'OTHER',
  remark?: string
): Promise<IRNCancelResponse> {
  const payload = {
    Irn: irn,
    CnlRsn: reason,
    CnlRem: remark || '',
  }

  const result = await apiCall('Invoice/Cancel', payload)

  if (result.Status !== 1 && result.Status !== 200) {
    const errors = result.ErrorDetails || []
    const errMsg = errors.map(e => `${e.ErrorCode}: ${e.ErrorMessage}`).join('; ')
    throw new Error(errMsg || 'IRN cancellation failed')
  }

  let cancelData: IRNCancelResponse
  if (typeof result.Data === 'string') {
    try {
      cancelData = JSON.parse(Buffer.from(result.Data, 'base64').toString('utf-8'))
    } catch {
      cancelData = JSON.parse(result.Data)
    }
  } else {
    cancelData = result.Data as unknown as IRNCancelResponse
  }

  return cancelData
}

/**
 * Get details of an existing IRN
 */
export async function getIRNDetails(irn: string): Promise<unknown> {
  const { token } = await authenticate()

  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1.03/Invoice/irn/${irn}`, {
    method: 'GET',
    headers: getHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`Get IRN failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Verify a GSTIN (get taxpayer details)
 */
export async function getGSTINDetails(gstin: string): Promise<unknown> {
  const { token } = await authenticate()

  const baseUrl = getBaseUrl()
  const response = await fetch(`${baseUrl}/api/v1.03/Master/GSTIN/${gstin}`, {
    method: 'GET',
    headers: getHeaders(token),
  })

  if (!response.ok) {
    throw new Error(`GSTIN lookup failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Clear the cached auth token (useful after auth errors)
 */
export function clearTokenCache(): void {
  tokenCache = null
}

/**
 * Check if GSP credentials are configured
 */
export function isGSPConfigured(): boolean {
  return !!(
    process.env.GSP_BASE_URL &&
    process.env.GSP_CLIENT_ID &&
    process.env.GSP_CLIENT_SECRET &&
    process.env.GSTN_GSTIN &&
    process.env.GSTN_USERNAME &&
    process.env.GSTN_PASSWORD
  )
}