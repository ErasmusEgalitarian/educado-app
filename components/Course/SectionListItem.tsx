import { AppColors } from '@/constants/theme/AppColors'
import { Section } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SectionListItemProps {
  section: Section
  isCompleted: boolean
  isLocked: boolean
  onPress: () => void
  score?: number
  totalQuestions?: number
}

const SectionListItem: React.FC<SectionListItemProps> = ({
  section,
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

  const scorePercentage =
    score !== undefined && totalQuestions
      ? Math.round((score / totalQuestions) * 100)
      : null

  const getStatusText = () => {
    if (isCompleted) {
      return `${section.questions.length}/${section.questions.length} ${t('common.completed')}`
    }
    return `0/${section.questions.length} ${t('common.completed')}`
  }

  const getStatusColor = () => {
    if (isCompleted) {
      return '#22C55E' // Green for completed
    }
    return colors.textSecondary // Gray for incomplete
  }

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

        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {isCompleted && scorePercentage !== null && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
                {scorePercentage}% {t('common.correct')}
              </Text>
            </>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={24}
        color={isLocked ? colors.locked : colors.textSecondary}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 70,
  },
  locked: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '400',
  },
})

export default SectionListItem
