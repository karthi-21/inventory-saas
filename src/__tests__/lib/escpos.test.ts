import { describe, it, expect } from 'vitest'
import { ESCPOSBuilder } from '@/lib/escpos'

describe('ESCPOSBuilder', () => {
  it('should initialize with empty buffer', () => {
    const builder = new ESCPOSBuilder()
    expect(builder.build()).toBeInstanceOf(Uint8Array)
  })

  it('should add text', () => {
    const builder = new ESCPOSBuilder()
    builder.text('Hello World')
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should add line feed via line()', () => {
    const builder = new ESCPOSBuilder()
    builder.line()
    const result = builder.build()
    expect(result).toContain(0x0A) // LF
  })

  it('should add double height via size()', () => {
    const builder = new ESCPOSBuilder()
    builder.size(1, 2)
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should add double width via size()', () => {
    const builder = new ESCPOSBuilder()
    builder.size(2, 1)
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should add center alignment via align()', () => {
    const builder = new ESCPOSBuilder()
    builder.align('center')
    const result = builder.build()
    expect(result).toContain(0x1B) // ESC
  })

  it('should add cut command', () => {
    const builder = new ESCPOSBuilder()
    builder.cut()
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should chain commands', () => {
    const builder = new ESCPOSBuilder()
    const result = builder
      .init()
      .align('center')
      .size(2, 2)
      .text('RECEIPT')
      .size(1, 1)
      .align('left')
      .text('Item 1')
      .line()
      .cut()
      .build()

    expect(result.length).toBeGreaterThan(10)
  })
})