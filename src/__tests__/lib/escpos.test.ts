import { describe, it, expect } from 'vitest'
import { EscPosBuilder } from '@/lib/escpos'

describe('EscPosBuilder', () => {
  it('should initialize with empty buffer', () => {
    const builder = new EscPosBuilder()
    expect(builder.build()).toBeInstanceOf(Uint8Array)
  })

  it('should add text', () => {
    const builder = new EscPosBuilder()
    builder.text('Hello World')
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should add line feed', () => {
    const builder = new EscPosBuilder()
    builder.lineFeed()
    const result = builder.build()
    expect(result).toContain(0x0A) // LF
  })

  it('should add double height', () => {
    const builder = new EscPosBuilder()
    builder.doubleHeight(true)
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should add double width', () => {
    const builder = new EscPosBuilder()
    builder.doubleWidth(true)
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should add center alignment', () => {
    const builder = new EscPosBuilder()
    builder.center()
    const result = builder.build()
    expect(result).toContain(0x1B) // ESC
  })

  it('should add cut command', () => {
    const builder = new EscPosBuilder()
    builder.cut()
    const result = builder.build()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should chain commands', () => {
    const builder = new EscPosBuilder()
    const result = builder
      .center()
      .doubleHeight(true)
      .text('RECEIPT')
      .doubleHeight(false)
      .left()
      .text('Item 1')
      .lineFeed()
      .cut()
      .build()

    expect(result.length).toBeGreaterThan(10)
  })
})