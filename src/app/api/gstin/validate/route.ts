import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/gstin/validate
 * Basic format validation for GSTIN (15-character Indian tax ID)
 *
 * Format: 27AABCU9603R1ZM
 * - First 2 digits: State code (01-37)
 * - Next 10 chars: PAN (uppercase alphanumeric)
 * - 13th char: Entity number (1-9 or A-Z)
 * - 14th char: Reserved (usually Z)
 * - 15th char: Checksum (uppercase letter or digit)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gstin } = body

    if (!gstin) {
      return NextResponse.json({ valid: false, error: 'GSTIN is required' }, { status: 400 })
    }

    const normalized = gstin.toUpperCase().trim()

    // Check length
    if (normalized.length !== 15) {
      return NextResponse.json({
        valid: false,
        error: 'GSTIN must be exactly 15 characters'
      })
    }

    // State code must be 01-37
    const stateCode = normalized.slice(0, 2)
    const stateNum = parseInt(stateCode, 10)
    if (isNaN(stateNum) || stateNum < 1 || stateNum > 37) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid state code in GSTIN'
      })
    }

    // Characters 3-12 must be alphanumeric (PAN format)
    const panPart = normalized.slice(2, 12)
    if (!/^[A-Z0-9]{10}$/.test(panPart)) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid PAN format in GSTIN'
      })
    }

    // 13th character: entity number (1-9 or A-Z)
    const entityChar = normalized[12]
    if (!/^[1-9A-Z]$/.test(entityChar)) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid entity number in GSTIN'
      })
    }

    // 14th character: should be Z (reserved)
    const reservedChar = normalized[13]
    if (reservedChar !== 'Z') {
      return NextResponse.json({
        valid: false,
        error: 'Invalid reserved character in GSTIN'
      })
    }

    // 15th character: checksum (uppercase letter or digit)
    const checksumChar = normalized[14]
    if (!/^[A-Z0-9]$/.test(checksumChar)) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid checksum character in GSTIN'
      })
    }

    // Basic format valid — return success
    return NextResponse.json({
      valid: true,
      gstin: normalized,
      message: 'GSTIN format is valid'
    })
  } catch (error) {
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 })
  }
}