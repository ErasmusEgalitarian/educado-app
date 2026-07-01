import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'

export type WebVideoStatus = 'idle' | 'loading' | 'error' | 'ready'

export interface WebVideoSource {
  /** Blob object URL to feed the player on web. `null` on native or before it resolves. */
  blobUrl: string | null
  /** Fetch lifecycle so the UI can show loading/error and offer a retry. */
  status: WebVideoStatus
  /** Re-run the fetch (used by the retry button). No-op on native. */
  retry: () => void
}

/**
 * On web, HTML5 <video> cannot send custom headers.
 * This hook fetches the video with Authorization header,
 * converts to a blob URL, and returns it as the source.
 * On native, returns an idle state with a null blob URL
 * (the caller should use headers directly).
 */
export function useWebVideoSource(
  url: string | null | undefined,
  token: string | null | undefined
): WebVideoSource {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<WebVideoStatus>('idle')
  const [retryKey, setRetryKey] = useState(0)

  const retry = useCallback(() => {
    setRetryKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'web' || !url || !url.startsWith('http')) {
      setBlobUrl(null)
      setStatus('idle')
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    setBlobUrl(null)
    setStatus('loading')

    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {}

    fetch(url, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setBlobUrl(objectUrl)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) {
          setBlobUrl(null)
          setStatus('error')
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, token, retryKey])

  return { blobUrl, status, retry }
}
