import { AppColors } from '@/constants/theme/AppColors'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface SectionProgressBarProps {
  currentActivity: number // 0-indexed
  totalActivities: number
}

const SectionProgressBar: React.FC<SectionProgressBarProps> = ({
  currentActivity,
  totalActivities,
}) => {
  const colors = AppColors()
  const percentage = Math.round(((currentActivity + 1) / totalActivities) * 100)

  return (
    <View style={styles.container}>
      {/* Progress Bars */}
      <View style={styles.barsContainer}>
        {Array.from({ length: totalActivities }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor:
                  index <= currentActivity
                    ? '#4A7C85' // Darker teal for completed
                    : '#B8D4D8', // Light teal for not completed
              },
            ]}
          />
        ))}
      </View>

      {/* Percentage */}
      <Text style={[styles.percentage, { color: colors.textPrimary }]}>
        {percentage}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    height: 8,
  },
  bar: {
    flex: 1,
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
})

export default SectionProgressBar
