import { AppColors } from '@/constants/theme/AppColors'
import { Ionicons } from '@expo/vector-icons'
import { VideoView, useVideoPlayer } from 'expo-video'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface VideoPlayerWithPausesProps {
  videoUrl: string
  pauseTimestamps: number[] // Array of timestamps (in seconds) where video should pause
  onPauseReached: (timestamp: number) => void
  isPaused: boolean // External control to pause/resume
  onResume?: () => void
  onVideoComplete?: () => void // Called when video finishes playing
}

const VideoPlayerWithPauses: React.FC<VideoPlayerWithPausesProps> = ({
  videoUrl,
  pauseTimestamps,
  onPauseReached,
  isPaused,
  onResume,
  onVideoComplete,
}) => {
  const colors = AppColors()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const hasTriggeredPause = useRef<boolean[]>(
    new Array(pauseTimestamps.length).fill(false)
  )
  const hasTriggeredComplete = useRef(false)

  const player = useVideoPlayer(videoUrl, (player) => {
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
          setError('Video playback error')
          setIsLoading(false)
          return
        }

        if (player.status === 'loading' || player.status === 'idle') {
          return
        }

        if (isLoading) {
          setIsLoading(false)
        }

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

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: colors.primaryLight }]}
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

        {isLoading && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading video...
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
    height: 480, // Fixed height for vertical video
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
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
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
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
