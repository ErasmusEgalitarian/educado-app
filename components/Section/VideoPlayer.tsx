import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useWebVideoSource } from '@/hooks/useWebVideoSource'
import { t } from '@/i18n/config'
import { getAuthHeaders } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { VideoView, useVideoPlayer } from 'expo-video'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

// If the video never leaves loading/idle within this window we assume the
// connection is too slow and surface a recoverable "slow connection" screen.
// This is the PRIMARY safety net: expo-video's `statusChange` can get stuck on
// 'loading' and never emit an 'error' when the network drops (expo/expo#33738).
const LOAD_TIMEOUT_MS = 12000

type VideoError = 'slow' | 'load'

interface VideoPlayerProps {
  videoUrl: string
  onProgressUpdate?: (percentage: number) => void
  onComplete?: () => void
  minimumWatchPercentage?: number
  onExit?: () => void
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onProgressUpdate,
  onComplete,
  minimumWatchPercentage = 80,
  onExit,
}) => {
  const colors = AppColors()
  const router = useRouter()
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [videoError, setVideoError] = useState<VideoError | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [hasCompletedMinimum, setHasCompletedMinimum] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)
  // True once the video has actually started playing at least once, so a later
  // return to 'loading' can be told apart (buffering) from the initial load.
  const hasStartedRef = useRef(false)

  // If no video URL, show placeholder and auto-complete
  const hasVideo = !!videoUrl && videoUrl.length > 0

  // On web, fetch video as blob (HTML5 <video> can't send custom headers)
  const {
    blobUrl: webBlobUrl,
    status: webStatus,
    retry: webRetry,
  } = useWebVideoSource(
    hasVideo && videoUrl.startsWith('http') ? videoUrl : null,
    token
  )

  // Build video source with Authorization header for native, blob URL for web
  const videoSource = useMemo(() => {
    if (!hasVideo) return null
    if (videoUrl.startsWith('http')) {
      if (Platform.OS === 'web') {
        return webBlobUrl ? { uri: webBlobUrl } : null
      }
      return { uri: videoUrl, headers: getAuthHeaders(token) }
    }
    return videoUrl
  }, [hasVideo, videoUrl, token, webBlobUrl])

  const player = useVideoPlayer(videoSource, (p) => {
    if (hasVideo) {
      p.loop = false
      p.play()
    }
  })

  // Auto-complete if there's no video
  useEffect(() => {
    if (!hasVideo && onComplete) {
      onComplete()
    }
  }, [hasVideo, onComplete])

  // React to player status transitions. `statusChange` is more responsive than
  // polling for catching hard errors and mid-playback buffering, but it is not
  // reliable on its own (it can stall on 'loading'), so the polling interval
  // below and the load timeout act as backstops.
  useEffect(() => {
    if (!player || !hasVideo) return

    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        setVideoError('load')
        setIsLoading(false)
        setIsBuffering(false)
        return
      }
      if (status === 'readyToPlay') {
        hasStartedRef.current = true
        setIsLoading(false)
        setIsBuffering(false)
        // Auto-recover the slow-connection screen if the video catches up.
        setVideoError((prev) => (prev === 'slow' ? null : prev))
        return
      }
      if (status === 'loading' && hasStartedRef.current) {
        setIsBuffering(true)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [player, hasVideo])

  // Web-only: surface a fetch failure as a recoverable load error.
  useEffect(() => {
    if (webStatus === 'error') {
      setVideoError('load')
      setIsLoading(false)
      setIsBuffering(false)
    }
  }, [webStatus])

  // Load timeout: if the video is still stuck loading after LOAD_TIMEOUT_MS and
  // never started playing, flip to the "slow connection" screen (retry + exit).
  useEffect(() => {
    if (!player || !hasVideo) return
    if (videoError || hasStartedRef.current) return

    const timer = setTimeout(() => {
      if (!hasStartedRef.current) {
        setVideoError('slow')
        setIsLoading(false)
      }
    }, LOAD_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [player, hasVideo, videoError, retryKey])

  // Auto-play on mount, pause on unmount
  useEffect(() => {
    if (!player || !hasVideo) return

    player.play()

    return () => {
      try {
        player.pause()
      } catch {
        // Ignore if player is already released
      }
    }
  }, [player, hasVideo])

  // Track video progress
  useEffect(() => {
    if (!player || !hasVideo) return

    const interval = setInterval(() => {
      try {
        if (player.status === 'error') {
          setVideoError('load')
          setIsLoading(false)
          setIsBuffering(false)
          return
        }

        if (player.status === 'loading' || player.status === 'idle') {
          if (hasStartedRef.current) {
            setIsBuffering(true)
          }
          return
        }

        // readyToPlay from here on.
        hasStartedRef.current = true
        if (isLoading) {
          setIsLoading(false)
        }
        setIsBuffering(false)
        setVideoError((prev) => (prev === 'slow' ? null : prev))

        const duration = player.duration
        const currentTime = player.currentTime

        if (duration && duration > 0) {
          const percentage = (currentTime / duration) * 100

          if (onProgressUpdate) {
            onProgressUpdate(percentage)
          }

          if (
            !hasCompletedMinimum &&
            percentage >= minimumWatchPercentage &&
            onComplete
          ) {
            setHasCompletedMinimum(true)
            onComplete()
          }

          // Reveal the "watch again" overlay once the video reaches the end.
          if (percentage >= 99.5) {
            setHasEnded(true)
          }
        }
      } catch {
        // Ignore transient errors
      }
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [
    player,
    hasVideo,
    isLoading,
    minimumWatchPercentage,
    onComplete,
    onProgressUpdate,
    hasCompletedMinimum,
  ])

  const handleExit = useCallback(() => {
    if (onExit) {
      onExit()
    } else {
      // Fallback so the user is never trapped when no handler is wired.
      router.back()
    }
  }, [onExit, router])

  const handleRetry = useCallback(() => {
    hasStartedRef.current = false
    setVideoError(null)
    setIsBuffering(false)
    setIsLoading(true)
    if (Platform.OS === 'web') {
      // Re-fetch the blob; the new URL flows back through `videoSource` and the
      // player reloads automatically.
      webRetry()
    } else if (player && videoSource) {
      try {
        player
          .replaceAsync(videoSource)
          .then(() => {
            try {
              player.play()
            } catch {
              // Ignore if the player was released mid-retry
            }
          })
          .catch(() => {
            setVideoError('load')
            setIsLoading(false)
          })
      } catch {
        setVideoError('load')
        setIsLoading(false)
      }
    }
    // Re-arm the load timeout for this fresh attempt.
    setRetryKey((key) => key + 1)
  }, [player, videoSource, webRetry])

  // No video, show placeholder
  if (!hasVideo) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.primaryLight }]}
      >
        <View style={styles.noVideoContainer}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.primary}
          />
          <Text style={[styles.noVideoText, { color: colors.textSecondary }]}>
            {t('section.noVideo')}
          </Text>
        </View>
      </View>
    )
  }

  if (videoError) {
    const isSlow = videoError === 'slow'
    return (
      <View
        style={[styles.container, { backgroundColor: colors.primaryLight }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name={isSlow ? 'cloud-offline-outline' : 'alert-circle-outline'}
            size={48}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {isSlow ? t('video.slowConnection') : t('video.loadError')}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {isSlow ? t('video.slowConnectionHint') : t('video.loadErrorHint')}
          </Text>

          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.82}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={18} color="#FDFEFF" />
              <Text style={styles.retryButtonText}>{t('video.retry')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exitButton}
              activeOpacity={0.74}
              onPress={handleExit}
            >
              <Text style={[styles.exitButtonText, { color: colors.error }]}>
                {t('video.exit')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  const handleReplay = () => {
    try {
      player.currentTime = 0
      player.play()
      setHasEnded(false)
    } catch {
      // Ignore if player is already released
    }
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        fullscreenOptions={{
          enable: true,
        }}
        allowsPictureInPicture
        nativeControls
      />

      {hasEnded && (
        <TouchableOpacity
          style={styles.replayOverlay}
          activeOpacity={0.85}
          onPress={handleReplay}
        >
          <Ionicons name="refresh" size={32} color="#FDFEFF" />
          <Text style={styles.replayText}>{t('section.watchAgain')}</Text>
        </TouchableOpacity>
      )}

      {isBuffering && !hasEnded && (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="small" color="#FDFEFF" />
          <Text style={styles.bufferingText}>{t('video.buffering')}</Text>
        </View>
      )}

      {isLoading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('common.loading')}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 470,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingOverlay: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 27, 31, 0.7)',
  },
  bufferingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FDFEFF',
  },
  replayOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20, 27, 31, 0.55)',
  },
  replayText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#FDFEFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  errorActions: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FDFEFF',
  },
  exitButton: {
    paddingVertical: 8,
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  noVideoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noVideoText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
})

export default VideoPlayer
