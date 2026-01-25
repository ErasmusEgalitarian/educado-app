import { AppColors } from '@/constants/theme/AppColors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface ButtonPrimaryProps {
  title: string
  onPress: () => void
  icon?: keyof typeof Ionicons.glyphMap
  disabled?: boolean
  loading?: boolean
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'outline'
    | 'tertiary'
  fullWidth?: boolean
}

const ButtonPrimary: React.FC<ButtonPrimaryProps> = ({
  title,
  onPress,
  icon,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
}) => {
  const colors = AppColors()

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onPress()
    }
  }

  const getBackgroundColor = () => {
    if (variant === 'outline') {
      return 'transparent'
    }
    if (disabled) return colors.locked
    switch (variant) {
      case 'secondary':
        return colors.secondary
      case 'tertiary':
        return colors.tertiary
      case 'success':
        return colors.success
      case 'warning':
        return colors.warning
      case 'error':
        return colors.error
      default:
        return colors.primary
    }
  }

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 2,
        borderColor: disabled ? colors.locked : colors.primary,
      }
    }
    return {}
  }

  const getTextColor = () => {
    if (variant === 'outline') {
      return disabled ? colors.locked : colors.primary
    }
    return colors.textLight
  }

  const getIconColor = () => {
    if (variant === 'outline') {
      return disabled ? colors.locked : colors.primary
    }
    return colors.textLight
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        getBorderStyle(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={getIconColor()} size="small" />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={24}
                color={getIconColor()}
                style={styles.icon}
              />
            )}
            <Text style={[styles.text, { color: getTextColor() }]}>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
})

export default ButtonPrimary
