'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook to detect USB barcode scanner input.
 * USB scanners act as keyboard input — rapid keypresses ending in Enter.
 * Typical scan: all characters arrive within 50-100ms, followed by Enter.
 */

interface UseBarcodeScannerOptions {
  /** Enable or disable the scanner listener */
  enabled?: boolean
  /** Minimum number of characters to consider a valid barcode (default: 3) */
  minLength?: number
  /** Maximum time between keypresses in a scan sequence (default: 50ms) */
  maxInterKeyDelay?: number
  /** Callback when a barcode is scanned */
  onScan: (barcode: string) => void
}

export function useBarcodeScanner({
  enabled = true,
  minLength = 3,
  maxInterKeyDelay = 50,
  onScan,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Ignore keypresses when typing in input/textarea (allow search input though)
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA') return
      if (target.tagName === 'INPUT' && target.getAttribute('type') !== 'search' && !(target as HTMLInputElement).dataset.barcodeTarget) return

      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      // Clear existing timeout
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      if (e.key === 'Enter') {
        // End of barcode scan
        const barcode = bufferRef.current
        bufferRef.current = ''
        if (barcode.length >= minLength) {
          e.preventDefault()
          onScan(barcode)
        }
        return
      }

      // If too much time passed between keys, start a new buffer
      if (timeSinceLastKey > maxInterKeyDelay * 10) {
        bufferRef.current = ''
      }

      // Only accept printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key

        // Set timeout to clear buffer if Enter never comes (not a barcode scan)
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = ''
        }, 200)
      }
    },
    [enabled, minLength, maxInterKeyDelay, onScan]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [enabled, handleKeyPress])
}