import { AppColors } from '@/constants/theme/AppColors'
import { t } from '@/i18n/config'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface ProgressBarProps {
  current: number
  total: number
  color?: string
  showLabel?: boolean
  height?: number
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  color,
  showLabel = true,
  height = 8,
}) => {
  const colors = AppColors()
  const percentage = total > 0 ? (current / total) * 100 : 0
  const progressColor = color || colors.primary

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.track,
          { height, backgroundColor: colors.progressIncomplete },
        ]}
      >
        <View
          style={[
            styles.progress,
            {
              width: `${percentage}%`,
              backgroundColor: progressColor,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {Math.round(percentage)}% {t('common.complete')}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'right',
  },
})

export default ProgressBar
