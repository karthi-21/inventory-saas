/**
 * E-Invoice JSON Generator
 *
 * Maps OmniBIZ invoice data to NIC e-invoice specification v1.1 format.
 * Generates the JSON payload required by GSTN for IRN generation.
 *
 * Reference: https://einv-apisandbox.nic.in/
 */

import type { SalesInvoice, SalesInvoiceItem, Customer, Store, Tenant } from '@prisma/client'

interface EInvoiceSellerDetails {
  Gstin: string
  LglNm: string
  TrdNm?: string
  Addr1: string
  Addr2?: string
  Loc?: string
  Pin: number
  Stcd: string
  Ph?: string
  Em?: string
}

interface EInvoiceBuyerDetails {
  Gstin: string
  LglNm: string
  TrdNm?: string
  Addr1: string
  Addr2?: string
  Loc?: string
  Pin: number
  Stcd: string
  Ph?: string
  Em?: string
  Pos: string // Place of supply - same as Stcd for intra-state
}

interface EInvoiceItem {
  SlNo: string
  PrdDesc: string
  HsnCd: string
  Qty: number
  Unit: string
  UnitPrice: number
  TotAmt: number
  Discount: number
  PreTaxVal?: number
  AssAmt: number
  GstRt: number
  CgstAmt: number
  SgstAmt: number
  IgstAmt: number
  TotItemVal: number
}

interface EInvoicePayload {
  Version: string
  TranDtls: {
    TaxSch: string // GST
    SupTyp: string // B2B, EXPWP, EXPWOP
    RegRev: string // Y/N - reverse charge
    EcmGstin?: string
  }
  DocDtls: {
    Typ: string // INV for invoice
    No: string
    Dt: string // DD/MM/YYYY
  }
  SellerDtls: EInvoiceSellerDetails
  BuyerDtls: EInvoiceBuyerDetails
  DispDtls?: {
    Nm?: string
    Addr1?: string
    Addr2?: string
    Loc?: string
    Pin?: number
    Stcd?: string
  }
  ShipDtls?: {
    Gstin?: string
    LglNm?: string
    Addr1?: string
    Addr2?: string
    Loc?: string
    Pin?: number
    Stcd?: string
  }
  ItemList: EInvoiceItem[]
  ValDtls: {
    AssVal: number
    CgstVal: number
    SgstVal: number
    IgstVal: number
    CessVal: number
    Discount: number
    OthChrg?: number
   RndOffAmt: number
    TotInvVal: number
  }
  RefDtls?: {
    PrecDoc?: {
      InvNo?: string
      InvDt?: string
    }
  }
  PayDtls?: {
    Nm?: string
    AccDet?: string
    Mode?: string // CASH, BANK, etc.
    PayTerm?: string
    PaidAmt?: number
    PaymtDue?: number
  }
}

// Indian state code mapping
const STATE_CODES: Record<string, string> = {
  'ANDHRA PRADESH': '37', 'ARUNACHAL PRADESH': '12', 'ASSAM': '18',
  'BIHAR': '10', 'CHHATTISGARH': '22', 'GOA': '30',
  'GUJARAT': '24', 'HARYANA': '06', 'HIMACHAL PRADESH': '02',
  'JHARKHAND': '20', 'KARNATAKA': '29', 'KERALA': '32',
  'MADHYA PRADESH': '23', 'MAHARASHTRA': '27', 'MANIPUR': '14',
  'MEGHALAYA': '17', 'MIZORAM': '15', 'NAGALAND': '13',
  'ODISHA': '21', 'PUNJAB': '03', 'RAJASTHAN': '08',
  'SIKKIM': '11', 'TAMIL NADU': '33', 'TELANGANA': '36',
  'TRIPURA': '16', 'UTTAR PRADESH': '09', 'UTTARAKHAND': '05',
  'WEST BENGAL': '19', 'ANDAMAN AND NICOBAR ISLANDS': '35',
  'CHANDIGARH': '04', 'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': '26',
  'DELHI': '07', 'JAMMU AND KASHMIR': '01', 'LADAKH': '38',
  'LAKSHADWEEP': '31', 'PUDUCHERRY': '34',
}

function getStateCode(stateName: string): string {
  if (!stateName) return '33' // default to Tamil Nadu
  const upper = stateName.toUpperCase().trim()
  // If already a number code
  if (/^\d{2}$/.test(upper)) return upper
  return STATE_CODES[upper] || '33'
}

function formatDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

/**
 * Build the e-invoice JSON payload from our invoice data
 */
export function buildEInvoiceJson(params: {
  invoice: SalesInvoice & { items: SalesInvoiceItem[] }
  customer: Customer | null
  store: Store & { tenant: Tenant }
  sellerState: string
}): EInvoicePayload {
  const { invoice, customer, store, sellerState } = params

  const sellerGstin = store.tenant.gstin || ''
  const sellerStateCode = getStateCode(sellerState)

  // Seller details from tenant
  const sellerDtls: EInvoiceSellerDetails = {
    Gstin: sellerGstin,
    LglNm: store.tenant.name,
    TrdNm: store.name,
    Addr1: store.tenant.address || store.address || '',
    Addr2: '',
    Loc: '',
    Pin: parseInt(store.tenant.pincode || store.pincode || '000000'),
    Stcd: sellerStateCode,
    Ph: store.tenant.phone || store.phone || '',
    Em: store.tenant.email || '',
  }

  // Buyer details
  const buyerGstin = invoice.gstin || customer?.gstin || ''
  const isInterState = customer?.state
    ? getStateCode(customer.state) !== sellerStateCode
    : false

  const buyerDtls: EInvoiceBuyerDetails = {
    Gstin: buyerGstin || 'URP', // URP = Unregistered Person for B2C
    LglNm: customer
      ? `${customer.firstName}${customer.lastName ? ' ' + customer.lastName : ''}`
      : 'Walk-in Customer',
    TrdNm: customer
      ? `${customer.firstName}${customer.lastName ? ' ' + customer.lastName : ''}`
      : '',
    Addr1: customer?.address || '',
    Addr2: '',
    Loc: customer?.city || '',
    Pin: parseInt(customer?.pincode || '000000'),
    Stcd: customer?.state ? getStateCode(customer.state) : sellerStateCode,
    Pos: customer?.state ? getStateCode(customer.state) : sellerStateCode,
    Ph: customer?.phone || '',
    Em: customer?.email || '',
  }

  // Line items
  const itemList: EInvoiceItem[] = invoice.items.map((item, index) => {
    const quantity = item.quantity
    const unitPrice = Number(item.unitPrice)
    const totalAmount = unitPrice * quantity
    const discount = Number(item.discountAmount)
    const assessableAmount = totalAmount - discount
    const gstRate = item.gstRate

    let cgstAmt = 0
    let sgstAmt = 0
    let igstAmt = 0

    if (isInterState) {
      igstAmt = Number(item.gstAmount)
    } else {
      cgstAmt = Number(item.gstAmount) / 2
      sgstAmt = Number(item.gstAmount) / 2
    }

    return {
      SlNo: String(index + 1),
      PrdDesc: item.description || '',
      HsnCd: item.hsnCode || '9999', // Default HSN for services
      Qty: quantity,
      Unit: 'NOS', // Default unit
      UnitPrice: unitPrice,
      TotAmt: totalAmount,
      Discount: discount,
      AssAmt: assessableAmount,
      GstRt: gstRate,
      CgstAmt: Math.round(cgstAmt * 100) / 100,
      SgstAmt: Math.round(sgstAmt * 100) / 100,
      IgstAmt: Math.round(igstAmt * 100) / 100,
      TotItemVal: Number(item.totalAmount),
    }
  })

  // Value details
  const subtotal = Number(invoice.subtotal)
  const totalDiscount = Number(invoice.totalDiscount)
  const totalGst = Number(invoice.totalGst)
  const cgstTotal = isInterState ? 0 : totalGst / 2
  const sgstTotal = isInterState ? 0 : totalGst / 2
  const igstTotal = isInterState ? totalGst : 0

  const valDtls = {
    AssVal: subtotal - totalDiscount,
    CgstVal: Math.round(cgstTotal * 100) / 100,
    SgstVal: Math.round(sgstTotal * 100) / 100,
    IgstVal: Math.round(igstTotal * 100) / 100,
    CessVal: 0,
    Discount: totalDiscount,
    RndOffAmt: Number(invoice.roundOff),
    TotInvVal: Number(invoice.totalAmount),
  }

  // Document type
  const docType = invoice.gstin || customer?.gstin ? 'INV' : 'INV'

  const payload: EInvoicePayload = {
    Version: '1.1',
    TranDtls: {
      TaxSch: 'GST',
      SupTyp: buyerGstin && buyerGstin !== 'URP' ? 'B2B' : 'B2C',
      RegRev: 'N',
    },
    DocDtls: {
      Typ: docType,
      No: invoice.invoiceNumber,
      Dt: formatDate(new Date(invoice.invoiceDate)),
    },
    SellerDtls: sellerDtls,
    BuyerDtls: buyerDtls,
    ItemList: itemList,
    ValDtls: valDtls,
  }

  // Payment details
  if (invoice.billingType !== 'CASH') {
    payload.PayDtls = {
      Nm: customer?.firstName || '',
      Mode: invoice.billingType,
      PaidAmt: Number(invoice.amountPaid),
      PaymtDue: Number(invoice.amountDue),
    }
  }

  return payload
}

/**
 * Validate that an invoice is eligible for e-invoicing
 * E-invoicing is mandatory for B2B invoices (where buyer has GSTIN)
 */
export function isEInvoiceEligible(params: {
  invoice: { gstin?: string | null; invoiceStatus: string }
  customer: { gstin?: string | null } | null
  tenantGstin?: string | null
}): { eligible: boolean; reason?: string } {
  // Must have a valid seller GSTIN
  if (!params.tenantGstin) {
    return { eligible: false, reason: 'Seller GSTIN not configured' }
  }

  // Invoice must be active
  if (params.invoice.invoiceStatus === 'CANCELLED') {
    return { eligible: false, reason: 'Invoice is cancelled' }
  }

  // B2C invoices (no buyer GSTIN) are not eligible for e-invoicing
  // They can still be reported in GSTR but don't get an IRN
  if (!params.invoice.gstin && !params.customer?.gstin) {
    return { eligible: false, reason: 'B2C invoice - IRN not required' }
  }

  // GSTIN must be valid format (15 chars)
  const buyerGstin = params.invoice.gstin || params.customer?.gstin || ''
  if (buyerGstin.length !== 15) {
    return { eligible: false, reason: 'Invalid buyer GSTIN format' }
  }

  return { eligible: true }
}