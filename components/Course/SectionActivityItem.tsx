import { AppColors } from '@/constants/theme/AppColors'
import { t } from '@/i18n/config'
import { SectionPhaseKind } from '@/utils/section-phases'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SectionActivityItemProps {
  title: string
  kind: SectionPhaseKind
  isCompleted: boolean
  isLocked: boolean
  onPress: () => void
}

const SectionActivityItem: React.FC<SectionActivityItemProps> = ({
  title,
  kind,
  isCompleted,
  isLocked,
  onPress,
}) => {
  const colors = AppColors()

  const iconName = getIconName(kind, isLocked)
  const titleColor = isLocked ? '#5A7A92' : '#28363E'
  const subtitleColor = isCompleted
    ? '#70A31F'
    : isLocked
      ? '#809CAD'
      : '#4E6879'

  const containerStyle = isLocked
    ? [styles.container, styles.lockedContainer, { backgroundColor: '#EBF0F2' }]
    : [
        styles.container,
        styles.enabledContainer,
        { backgroundColor: colors.cardBackground },
      ]

  const subtitle = isCompleted
    ? t('common.completed')
    : isLocked
      ? t('section.lockedStatus')
      : t('section.notStarted')

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={isLocked}
      activeOpacity={0.78}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor }]}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name={iconName}
        size={24}
        color={isLocked ? '#6687A2' : '#4E6879'}
      />
    </TouchableOpacity>
  )
}

function getIconName(kind: SectionPhaseKind, isLocked: boolean) {
  if (isLocked) {
    return 'lock-closed-outline' as const
  }

  if (kind === 'video') {
    return 'play-circle' as const
  }

  if (kind === 'reading') {
    return 'book-outline' as const
  }

  return 'create-outline' as const
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  enabledContainer: {
    shadowColor: '#28363E',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  lockedContainer: {
    opacity: 0.96,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },
})

export default SectionActivityItem
