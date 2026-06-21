import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useWebVideoSource } from '@/hooks/useWebVideoSource'
import { t } from '@/i18n/config'
import { getAuthHeaders } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface VideoPlayerProps {
  videoUrl: string
  onProgressUpdate?: (percentage: number) => void
  onComplete?: () => void
  minimumWatchPercentage?: number
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onProgressUpdate,
  onComplete,
  minimumWatchPercentage = 80,
}) => {
  const colors = AppColors()
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompletedMinimum, setHasCompletedMinimum] = useState(false)
  const [hasEnded, setHasEnded] = useState(false)

  // If no video URL, show placeholder and auto-complete
  const hasVideo = !!videoUrl && videoUrl.length > 0

  // On web, fetch video as blob (HTML5 <video> can't send custom headers)
  const webBlobUrl = useWebVideoSource(
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
          setError(t('errors.loadSection'))
          setIsLoading(false)
          return
        }

        if (player.status === 'loading' || player.status === 'idle') {
          return
        }

        if (isLoading) {
          setIsLoading(false)
        }

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

  // No video — show placeholder
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

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.primaryLight }]}
      >
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t('errors.loadSection')}
          </Text>
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
