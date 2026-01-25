import { AppColors } from '@/constants/theme/AppColors'
import { VideoView, useVideoPlayer } from 'expo-video'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasCompletedMinimum, setHasCompletedMinimum] = useState(false)

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false
    player.play()
  })

  useEffect(() => {
    if (!player) return

    const interval = setInterval(() => {
      try {
        // Handle error status
        if (player.status === 'error') {
          setError('Video playback error')
          setIsLoading(false)
          return
        }

        // Skip if still loading or idle
        if (player.status === 'loading' || player.status === 'idle') {
          return
        }

        // Video is ready, hide loading
        if (isLoading) {
          setIsLoading(false)
        }

        // Track progress
        const duration = player.duration
        const currentTime = player.currentTime

        if (duration && duration > 0) {
          const percentage = (currentTime / duration) * 100

          if (onProgressUpdate) {
            onProgressUpdate(percentage)
          }

          // Trigger completion callback once when threshold is reached
          if (
            !hasCompletedMinimum &&
            percentage >= minimumWatchPercentage &&
            onComplete
          ) {
            setHasCompletedMinimum(true)
            onComplete()
          }
        }
      } catch (err) {
        console.error('Video player error:', err)
      }
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [
    player,
    isLoading,
    minimumWatchPercentage,
    onComplete,
    onProgressUpdate,
    hasCompletedMinimum,
  ])

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundSecondary },
        ]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Unable to load video
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            {error}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls
      />

      {isLoading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: colors.backgroundSecondary },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading video...
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
})

export default VideoPlayer
