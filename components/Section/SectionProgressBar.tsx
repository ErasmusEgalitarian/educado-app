import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SectionProgressBarProps {
  currentActivity: number
  totalActivities: number
  onBack?: () => void
  textColor?: string
  activeColor?: string
  inactiveColor?: string
}

const SectionProgressBar: React.FC<SectionProgressBarProps> = ({
  currentActivity,
  totalActivities,
  onBack,
  textColor = '#4E6879',
  activeColor = '#246670',
  inactiveColor = '#D8EFF3',
}) => {
  const safeTotal = Math.max(totalActivities, 1)
  const safeCurrent = Math.max(0, Math.min(currentActivity, safeTotal - 1))
  const percentage = Math.round(((safeCurrent + 1) / safeTotal) * 100)

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.72}
        disabled={!onBack}
      >
        <Ionicons name="chevron-back" size={18} color="#28363E" />
      </TouchableOpacity>

      <View style={styles.barsContainer}>
        {Array.from({ length: safeTotal }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              {
                backgroundColor:
                  index <= safeCurrent ? activeColor : inactiveColor,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.percentage, { color: textColor }]}>
        {percentage}%
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  backButton: {
    width: 16,
    height: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 8,
  },
  bar: {
    flex: 1,
    borderRadius: 999,
  },
  percentage: {
    marginLeft: 8,
    minWidth: 36,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    textAlign: 'right',
  },
})

export default SectionProgressBar
