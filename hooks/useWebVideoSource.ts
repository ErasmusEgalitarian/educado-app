import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

/**
 * On web, HTML5 <video> cannot send custom headers.
 * This hook fetches the video with Authorization header,
 * converts to a blob URL, and returns it as the source.
 * On native, returns null (the caller should use headers directly).
 */
export function useWebVideoSource(
  url: string | null | undefined,
  token: string | null | undefined
): string | null {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web' || !url || !url.startsWith('http')) {
      setBlobUrl(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

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
      })
      .catch(() => {
        if (!cancelled) setBlobUrl(null)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url, token])

  return blobUrl
}
