import { useUser } from '@/contexts/UserContext'
import { syncAllProgress } from '@/utils/progress-sync'
import { useEffect, useRef } from 'react'

/**
 * Hook to periodically sync progress and certificates to backend
 * Syncs every 5 minutes while the app is active
 */
export function usePeriodicSync() {
  const { user } = useUser()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!user) {
      // Clear interval if user logs out
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial sync (after a short delay to avoid conflicting with login sync)
    const initialTimeout = setTimeout(() => {
      console.log('🔄 Running periodic sync...')
      syncAllProgress().catch((error) => {
        console.error('Periodic sync failed:', error)
      })
    }, 30000) // 30 seconds after component mount

    // Set up periodic sync every 5 minutes
    intervalRef.current = setInterval(
      () => {
        console.log('🔄 Running periodic sync...')
        syncAllProgress().catch((error) => {
          console.error('Periodic sync failed:', error)
        })
      },
      5 * 60 * 1000
    ) // 5 minutes

    // Cleanup
    return () => {
      clearTimeout(initialTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [user])
}
