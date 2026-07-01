import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useWebVideoSource } from '@/hooks/useWebVideoSource'
import { t } from '@/i18n/config'
import { getAuthHeaders } from '@/services/api'
import { getVideoSource } from '@/utils/video-assets'
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

// See VideoPlayer.tsx: the manual timeout is the primary safety net because
// expo-video's `statusChange` can stall on 'loading' without ever emitting an
// 'error' when the network drops.
const LOAD_TIMEOUT_MS = 12000

type VideoError = 'slow' | 'load'

interface VideoPlayerWithPausesProps {
  videoUrl: string
  pauseTimestamps: number[] // Array of timestamps (in seconds) where video should pause
  onPauseReached: (timestamp: number) => void
  isPaused: boolean // External control to pause/resume
  onResume?: () => void
  onVideoComplete?: () => void // Called when video finishes playing
  onExit?: () => void
}

const VideoPlayerWithPauses: React.FC<VideoPlayerWithPausesProps> = ({
  videoUrl,
  pauseTimestamps,
  onPauseReached,
  isPaused,
  onResume,
  onVideoComplete,
  onExit,
}) => {
  const colors = AppColors()
  const router = useRouter()
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [videoError, setVideoError] = useState<VideoError | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const hasTriggeredPause = useRef<boolean[]>(
    new Array(pauseTimestamps.length).fill(false)
  )
  const hasTriggeredComplete = useRef(false)
  // True once the video has actually started playing at least once, so a later
  // return to 'loading' can be told apart (buffering) from the initial load.
  const hasStartedRef = useRef(false)

  // Resolve local/remote video source
  const resolvedSource = useMemo(() => getVideoSource(videoUrl), [videoUrl])
  const remoteUrl =
    typeof resolvedSource === 'string' && resolvedSource.startsWith('http')
      ? resolvedSource
      : null

  // On web, fetch video as blob (HTML5 <video> can't send custom headers)
  const {
    blobUrl: webBlobUrl,
    status: webStatus,
    retry: webRetry,
  } = useWebVideoSource(remoteUrl, token)

  // Build video source with auth headers for native, blob URL for web
  const videoSource = useMemo(() => {
    if (remoteUrl) {
      if (Platform.OS === 'web') {
        return webBlobUrl ? { uri: webBlobUrl } : null
      }
      return { uri: remoteUrl, headers: getAuthHeaders(token) }
    }
    return resolvedSource
  }, [remoteUrl, resolvedSource, token, webBlobUrl])

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false
    player.play()
  })

  // Reset triggered pauses when timestamps change
  useEffect(() => {
    hasTriggeredPause.current = new Array(pauseTimestamps.length).fill(false)
    hasTriggeredComplete.current = false
  }, [pauseTimestamps])

  // Auto-play on mount
  useEffect(() => {
    if (!player) return

    player.play()

    return () => {
      try {
        player.pause()
      } catch (err) {
        console.log('Video player cleanup (already released)', err)
      }
    }
  }, [player])

  // React to player status transitions for hard errors and mid-playback
  // buffering. Not reliable on its own, so the interval and load timeout below
  // act as backstops.
  useEffect(() => {
    if (!player) return

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
  }, [player])

  // Web-only: surface a fetch failure as a recoverable load error.
  useEffect(() => {
    if (webStatus === 'error') {
      setVideoError('load')
      setIsLoading(false)
      setIsBuffering(false)
    }
  }, [webStatus])

  // Load timeout: if still stuck loading after LOAD_TIMEOUT_MS and never started
  // playing, flip to the "slow connection" screen (retry + exit).
  useEffect(() => {
    if (!player) return
    if (videoError || hasStartedRef.current) return

    const timer = setTimeout(() => {
      if (!hasStartedRef.current) {
        setVideoError('slow')
        setIsLoading(false)
      }
    }, LOAD_TIMEOUT_MS)

    return () => clearTimeout(timer)
  }, [player, videoError, retryKey])

  // Handle external pause control
  useEffect(() => {
    if (!player) return

    if (isPaused) {
      player.pause()
    } else {
      player.play()
      onResume?.()
    }
  }, [isPaused, player, onResume])

  // Monitor video progress and check for pause timestamps
  useEffect(() => {
    if (!player) return

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

        const time = player.currentTime
        const dur = player.duration

        // Update state for UI
        setCurrentTime(time)
        setDuration(dur || 0)

        // Check if video has completed (within 1 second of end)
        if (
          dur &&
          time >= dur - 1 &&
          !hasTriggeredComplete.current &&
          onVideoComplete
        ) {
          hasTriggeredComplete.current = true
          onVideoComplete()
        }

        // Check if we've reached a pause timestamp
        pauseTimestamps.forEach((timestamp, index) => {
          // Only check pauses that haven't been triggered yet
          if (
            !hasTriggeredPause.current[index] &&
            time >= timestamp &&
            time < timestamp + 0.5 // 0.5 second window
          ) {
            hasTriggeredPause.current[index] = true
            player.pause()
            onPauseReached(timestamp)
          }
        })
      } catch (err) {
        console.error('Video player error:', err)
      }
    }, 100) // Check every 100ms for more accurate pause timing

    return () => {
      clearInterval(interval)
    }
  }, [player, isLoading, pauseTimestamps, onPauseReached, onVideoComplete])

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
    hasTriggeredComplete.current = false
    setVideoError(null)
    setIsBuffering(false)
    setIsLoading(true)
    if (Platform.OS === 'web') {
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
    setRetryKey((key) => key + 1)
  }, [player, videoSource, webRetry])

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

  const handleSeekBackward = () => {
    if (!player) return

    if (isPaused) {
      // When paused, find the current pause we're at
      const currentPauseIndex = pauseTimestamps.findIndex(
        (timestamp) => Math.abs(timestamp - currentTime) < 1
      )

      if (currentPauseIndex > 0) {
        // Go back to the previous pause timestamp
        const previousPauseTimestamp = pauseTimestamps[currentPauseIndex - 1]
        player.currentTime = previousPauseTimestamp + 0.5
        // Reset the triggered flag for the current pause so it can trigger again
        hasTriggeredPause.current[currentPauseIndex] = false
      } else {
        // If we're at the first pause, go to the beginning
        player.currentTime = 0
        // Reset the triggered flag for the current pause
        if (currentPauseIndex === 0) {
          hasTriggeredPause.current[0] = false
        }
      }
      // Resume playing so they can watch the segment again
      player.play()
      onResume?.()
    } else {
      // When playing, find the last pause timestamp that we've passed
      const lastPauseTimestamp = pauseTimestamps
        .filter((timestamp) => timestamp < currentTime - 2)
        .sort((a, b) => b - a)[0]

      if (lastPauseTimestamp !== undefined) {
        // Jump slightly after the pause point (2 seconds after) to avoid re-triggering
        player.currentTime = lastPauseTimestamp + 2
      } else {
        // If no previous pause, go to beginning
        player.currentTime = 0
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <View>
      <View style={styles.container}>
        <VideoView
          style={styles.video}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />

        {/* Pause Overlay */}
        {isPaused && (
          <View style={styles.pauseOverlay}>
            <View style={styles.pauseIcon}>
              <Ionicons name="pause" size={64} color="#FFFFFF" />
            </View>
          </View>
        )}

        {isBuffering && !isPaused && (
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

      {/* Custom Controls Below Video */}
      {!isLoading && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSeekBackward}
          >
            <Ionicons name="play-back" size={28} color={colors.primary} />
            <Text
              style={[styles.controlLabel, { color: colors.textSecondary }]}
            >
              {isPaused ? 'Rewatch segment' : 'Previous pause'}
            </Text>
          </TouchableOpacity>

          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: colors.textPrimary }]}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </Text>
          </View>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
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
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeContainer: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
  },
})

export default VideoPlayerWithPauses
