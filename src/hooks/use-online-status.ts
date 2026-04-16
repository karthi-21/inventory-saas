'use client'

import { useState, useEffect, useCallback } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshPendingCount = useCallback(async () => {
    try {
      const { getOfflinePendingCount } = await import('@/lib/offline-sync')
      const count = await getOfflinePendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB might not be available
    }
  }, [])

  useEffect(() => {
    refreshPendingCount()
    const interval = setInterval(refreshPendingCount, 5000)
    return () => clearInterval(interval)
  }, [refreshPendingCount])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      const sync = async () => {
        setIsSyncing(true)
        try {
          const { syncPendingInvoices } = await import('@/lib/offline-sync')
          const result = await syncPendingInvoices()
          if (result.synced > 0 || result.conflicts > 0) {
            await refreshPendingCount()
          }
        } catch (err) {
          console.error('Sync failed:', err)
        } finally {
          setIsSyncing(false)
        }
      }
      sync()
    }
  }, [isOnline, pendingCount, isSyncing, refreshPendingCount])

  return { isOnline, pendingCount, isSyncing, refreshPendingCount }
}