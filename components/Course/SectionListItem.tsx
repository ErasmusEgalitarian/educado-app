import { AppColors } from '@/constants/theme/AppColors'
import { Section } from '@/data/mock-data'
import { formatDuration } from '@/utils/formatters'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SectionListItemProps {
  section: Section
  sectionNumber: number
  isCompleted: boolean
  isLocked: boolean
  onPress: () => void
  score?: number // Score percentage (0-100)
  totalQuestions?: number
}

const SectionListItem: React.FC<SectionListItemProps> = ({
  section,
  sectionNumber,
  isCompleted,
  isLocked,
  onPress,
  score,
  totalQuestions,
}) => {
  const colors = AppColors()

  const handlePress = () => {
    if (!isLocked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress()
    }
  }

  const getStatusIcon = () => {
    if (isCompleted) {
      return (
        <Ionicons name="checkmark-circle" size={28} color={colors.completed} />
      )
    }
    if (isLocked) {
      return <Ionicons name="lock-closed" size={28} color={colors.locked} />
    }
    return (
      <Ionicons
        name="play-circle-outline"
        size={28}
        color={colors.inProgress}
      />
    )
  }

  const scorePercentage =
    score !== undefined && totalQuestions
      ? Math.round((score / totalQuestions) * 100)
      : null

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
        isLocked && styles.locked,
      ]}
      onPress={handlePress}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      <View style={[styles.numberBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.numberText}>{sectionNumber}</Text>
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: isLocked ? colors.locked : colors.textPrimary },
          ]}
          numberOfLines={2}
        >
          {section.title}
        </Text>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Ionicons
              name="videocam-outline"
              size={16}
              color={isLocked ? colors.locked : colors.textSecondary}
            />
            <Text
              style={[styles.metadataText, { color: colors.textSecondary }]}
            >
              {formatDuration(section.duration)}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Ionicons
              name="help-circle-outline"
              size={16}
              color={isLocked ? colors.locked : colors.textSecondary}
            />
            <Text
              style={[styles.metadataText, { color: colors.textSecondary }]}
            >
              {section.questions.length} questions
            </Text>
          </View>
        </View>

        {/* Show score if section is completed */}
        {isCompleted && scorePercentage !== null && (
          <View style={styles.scoreContainer}>
            <View
              style={[
                styles.scoreBadge,
                {
                  backgroundColor:
                    scorePercentage >= 75
                      ? colors.success
                      : scorePercentage >= 50
                        ? colors.warning
                        : colors.error,
                },
              ]}
            >
              <Ionicons
                name={
                  scorePercentage >= 75
                    ? 'checkmark-circle'
                    : scorePercentage >= 50
                      ? 'warning'
                      : 'close-circle'
                }
                size={16}
                color={colors.textLight}
              />
              <Text style={[styles.scoreText, { color: colors.textLight }]}>
                Score: {scorePercentage}%
              </Text>
            </View>
            {scorePercentage < 75 && (
              <Text style={[styles.retakeHint, { color: colors.warning }]}>
                Retake to improve
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.statusIcon}>{getStatusIcon()}</View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 80,
  },
  locked: {
    opacity: 0.6,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  metadata: {
    flexDirection: 'row',
    gap: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 14,
  },
  scoreContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  retakeHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statusIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default SectionListItem
