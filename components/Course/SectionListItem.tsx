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
    // Support both legacy questions and new activities format
    const totalItems =
      section.activities?.length || section.questions?.length || 0

    if (isCompleted) {
      return `${totalItems}/${totalItems} ${t('common.completed')}`
    }
    if (isLocked) {
      return t('section.lockedStatus')
    }

    return `0/${totalItems} ${t('section.notStarted')}`
  }

  const getStatusColor = () => {
    if (isCompleted) {
      return '#70A31F'
    }
    if (isLocked) {
      return '#809CAD'
    }
    return '#4E6879'
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isLocked ? '#EBF0F2' : colors.cardBackground,
        },
        isLocked && styles.locked,
      ]}
      onPress={handlePress}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: isLocked ? '#5A7A92' : '#28363E' }]}
          numberOfLines={2}
        >
          {section.title}
        </Text>

        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {isCompleted && scorePercentage !== null && (
            <Text style={[styles.scoreText, { color: colors.textSecondary }]}>
              {scorePercentage}% {t('common.correct')}
            </Text>
          )}
        </View>
      </View>

      <Ionicons
        name={isLocked ? 'lock-closed-outline' : 'chevron-forward'}
        size={24}
        color={isLocked ? '#6687A2' : '#4E6879'}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 20,
    minHeight: 67,
    shadowColor: '#28363E',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  locked: {
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 23,
    marginBottom: 6,
  },
  statusRow: {
    alignItems: 'flex-start',
    gap: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    flexShrink: 1,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 21,
    flexShrink: 1,
  },
})

export default SectionListItem
