/**
 * ESC/POS Command Builder for Thermal Receipt Printers
 * Supports 58mm/80mm printers via Web Serial API (USB) or network (WebSocket)
 */

/* Web Serial API types (browser-only) */
interface SerialPort {
  readable: ReadableStream | null
  writable: WritableStream | null
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
}
interface SerialPortInfo { usbVendorId?: number; usbProductId?: number } // eslint-disable-line @typescript-eslint/no-unused-vars

declare global {
  interface Navigator {
    serial: {
      requestPort(): Promise<SerialPort>
      getPorts(): Promise<SerialPort[]>
    }
  }
}

const ESC = 0x1B
const GS = 0x1D
const LF = 0x0A

export class ESCPOSBuilder {
  private buffer: number[] = []

  init(): this { this.buffer.push(ESC, 0x40); return this }
  text(str: string): this { for (let i = 0; i < str.length; i++) this.buffer.push(str.charCodeAt(i)); return this }
  bold(on: boolean): this { this.buffer.push(ESC, 0x45, on ? 1 : 0); return this }
  underline(on: boolean): this { this.buffer.push(ESC, 0x2D, on ? 1 : 0); return this }
  align(mode: 'left' | 'center' | 'right'): this { this.buffer.push(ESC, 0x61, mode === 'left' ? 0 : mode === 'center' ? 1 : 2); return this }
  size(width: 1 | 2, height: 1 | 2): this { this.buffer.push(GS, 0x21, (width === 2 ? 0x10 : 0) | (height === 2 ? 0x01 : 0)); return this }
  line(lines: number = 1): this { for (let i = 0; i < lines; i++) this.buffer.push(LF); return this }
  separator(char: string = '-'): this { this.text(char.repeat(48)).line(); return this }
  cut(partial: boolean = false): this { this.buffer.push(GS, 0x56, partial ? 1 : 0); return this }
  cashDrawer(): this { this.buffer.push(ESC, 0x70, 0x00, 0x19, 0x37); return this }
  tableRow(columns: Array<{ text: string; width: number; align: 'left' | 'right' }>): this {
    let line = ''
    for (const col of columns) line += col.align === 'right' ? col.text.padStart(col.width) : col.text.padEnd(col.width)
    this.text(line).line(); return this
  }
  qrCode(data: string): this {
    const dataBytes = Array.from(data).map(c => c.charCodeAt(0))
    const len = dataBytes.length + 3
    this.buffer.push(GS, 0x28, 0x6B, len % 256, Math.floor(len / 256), 0x31, 0x50, 0x30, ...dataBytes)
    this.buffer.push(GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30)
    return this
  }
  build(): Uint8Array { return new Uint8Array(this.buffer) }
}

export function generateReceipt(params: {
  storeName: string; storeAddress?: string; storePhone?: string; storeGstin?: string
  invoiceNumber: string; date: string; cashierName?: string
  items: Array<{ name: string; qty: number; rate: number; amount: number; gstRate?: number }>
  subtotal: number; totalDiscount: number; totalGst: number; roundOff: number; totalAmount: number
  paymentMethod: string; amountPaid: number; changeDue?: number
  customerName?: string; customerPhone?: string; qrData?: string
}): ESCPOSBuilder {
  const p = new ESCPOSBuilder().init().align('center').bold(true).size(2, 2).text(params.storeName).size(1, 1).bold(false).line()
  if (params.storeAddress) p.text(params.storeAddress).line()
  if (params.storePhone) p.text(`Ph: ${params.storePhone}`).line()
  if (params.storeGstin) p.text(`GSTIN: ${params.storeGstin}`).line()
  p.separator().align('left').text(`Bill No: ${params.invoiceNumber}`).line().text(`Date:   ${params.date}`).line()
  if (params.cashierName) p.text(`Cashier: ${params.cashierName}`).line()
  if (params.customerName) p.text(`Customer: ${params.customerName}`).line()
  if (params.customerPhone) p.text(`Phone: ${params.customerPhone}`).line()
  p.separator().bold(true).tableRow([{ text: 'Item', width: 24, align: 'left' }, { text: 'Qty', width: 5, align: 'right' }, { text: 'Rate', width: 9, align: 'right' }, { text: 'Amt', width: 10, align: 'right' }]).bold(false).separator()
  for (const item of params.items) {
    const name = item.name.length > 23 ? item.name.substring(0, 23) : item.name
    p.text(name.padEnd(24)).text(String(item.qty).padStart(5)).text(item.rate.toFixed(2).padStart(9)).text(item.amount.toFixed(2).padStart(10)).line()
  }
  p.separator()
  p.tableRow([{ text: 'Subtotal', width: 33, align: 'left' }, { text: `₹${params.subtotal.toFixed(2)}`, width: 15, align: 'right' }])
  if (params.totalDiscount > 0) p.tableRow([{ text: 'Discount', width: 33, align: 'left' }, { text: `-₹${params.totalDiscount.toFixed(2)}`, width: 15, align: 'right' }])
  p.tableRow([{ text: 'GST', width: 33, align: 'left' }, { text: `₹${params.totalGst.toFixed(2)}`, width: 15, align: 'right' }])
  if (params.roundOff !== 0) p.tableRow([{ text: 'Round Off', width: 33, align: 'left' }, { text: `₹${params.roundOff.toFixed(2)}`, width: 15, align: 'right' }])
  p.bold(true).tableRow([{ text: 'TOTAL', width: 33, align: 'left' }, { text: `₹${params.totalAmount.toFixed(2)}`, width: 15, align: 'right' }]).bold(false).separator()
  p.tableRow([{ text: `Paid (${params.paymentMethod})`, width: 33, align: 'left' }, { text: `₹${params.amountPaid.toFixed(2)}`, width: 15, align: 'right' }])
  if (params.changeDue && params.changeDue > 0) p.tableRow([{ text: 'Change', width: 33, align: 'left' }, { text: `₹${params.changeDue.toFixed(2)}`, width: 15, align: 'right' }])
  p.separator().align('center').text('Thank you for visiting!').line().text('Visit again').line()
  if (params.qrData) p.line().qrCode(params.qrData).line()
  return p.line(3).cut()
}

export async function connectUSBPrinter(): Promise<SerialPort | null> {
  if (!('serial' in navigator)) { console.error('Web Serial API not supported'); return null }
  try {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: 9600 })
    return port
  } catch (err) { console.error('Failed to connect to printer:', err); return null }
}

export async function printViaSerial(port: SerialPort, data: Uint8Array): Promise<void> {
  const writer = port.writable?.getWriter()
  if (!writer) throw new Error('Printer port not writable')
  try { await writer.write(data) } finally { writer.releaseLock() }
}

export async function printViaNetwork(host: string, port: number, data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://${host}:${port}`)
    socket.binaryType = 'arraybuffer'
    socket.onopen = () => { socket.send(data); setTimeout(() => { socket.close(); resolve() }, 1000) }
    socket.onerror = (err) => reject(new Error(`Network printer failed: ${err}`))
    socket.onclose = () => resolve()
  })
}
