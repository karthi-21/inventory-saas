'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('SW registered:', reg.scope)
          // Check for updates periodically
          setInterval(() => reg.update(), 60 * 60 * 1000)
        })
        .catch((err) => console.error('SW registration failed:', err))
    }
  }, [])

  return null
}