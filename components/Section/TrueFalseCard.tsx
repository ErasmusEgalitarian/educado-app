import { AppColors } from '@/constants/theme/AppColors'
import { imageLoader } from '@/utils/image-loader'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface TrueFalseCardProps {
  question: string
  imageUrl?: string // Optional image asset name (without extension)
  onAnswer: (isCorrect: boolean, answer: boolean) => void
  correctAnswer: boolean
  currentActivity: number
  totalActivities: number
}

const TrueFalseCard: React.FC<TrueFalseCardProps> = ({
  question,
  imageUrl,
  onAnswer,
  correctAnswer,
  currentActivity,
  totalActivities,
}) => {
  const colors = AppColors()
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const scaleAnimTrue = React.useRef(new Animated.Value(1)).current
  const scaleAnimFalse = React.useRef(new Animated.Value(1)).current

  const handleAnswer = (answer: boolean) => {
    if (hasSubmitted) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelectedAnswer(answer)
    setHasSubmitted(true)

    const isCorrect = answer === correctAnswer

    // Animate button press
    const scaleAnim = answer ? scaleAnimTrue : scaleAnimFalse
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()

    // Haptic feedback
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }

    // Call onAnswer after delay
    setTimeout(() => {
      onAnswer(isCorrect, answer)
    }, 1500)
  }

  const getButtonStyle = (answer: boolean) => {
    if (!hasSubmitted) {
      return answer ? styles.trueButton : styles.falseButton
    }

    const isCorrect = answer === correctAnswer
    const isSelected = selectedAnswer === answer

    if (isSelected) {
      return isCorrect ? styles.correctButton : styles.incorrectButton
    }

    // Show correct answer even if not selected
    if (isCorrect) {
      return styles.correctButton
    }

    return answer ? styles.trueButton : styles.falseButton
  }

  return (
    <View style={styles.container}>
      {/* Optional Image/Video Frame */}
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={imageLoader(imageUrl)}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Question Text */}
      <Text style={[styles.question, { color: colors.textPrimary }]}>
        {question}
      </Text>

      {/* Activity Counter */}
      <Text style={[styles.counter, { color: colors.textPrimary }]}>
        {currentActivity}/{totalActivities}
      </Text>

      {/* True/False Buttons */}
      <View style={styles.buttonsContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnimFalse }] }}>
          <TouchableOpacity
            style={[
              getButtonStyle(false),
              { backgroundColor: colors.errorBright },
              hasSubmitted &&
                selectedAnswer !== false &&
                correctAnswer !== false && { opacity: 0.5 },
            ]}
            onPress={() => handleAnswer(false)}
            disabled={hasSubmitted}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={72} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnimTrue }] }}>
          <TouchableOpacity
            style={[
              getButtonStyle(true),
              { backgroundColor: colors.successBright },
              hasSubmitted &&
                selectedAnswer !== true &&
                correctAnswer !== true && { opacity: 0.5 },
            ]}
            onPress={() => handleAnswer(true)}
            disabled={hasSubmitted}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={72} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Feedback after submission */}
      {hasSubmitted && (
        <View style={styles.feedbackContainer}>
          {selectedAnswer === correctAnswer ? (
            <View style={styles.feedbackRow}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.successBright}
              />
              <Text
                style={[styles.feedbackText, { color: colors.successBright }]}
              >
                Correto!
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackRow}>
              <Ionicons
                name="close-circle"
                size={24}
                color={colors.errorBright}
              />
              <Text
                style={[styles.feedbackText, { color: colors.errorBright }]}
              >
                Incorreto. A resposta é {correctAnswer ? 'Verdadeiro' : 'Falso'}
                .
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#D3C5B8',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 28,
  },
  counter: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 32,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  falseButton: {
    width: 160,
    height: 160,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  trueButton: {
    width: 160,
    height: 160,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  correctButton: {
    width: 160,
    height: 160,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8FB442',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  incorrectButton: {
    width: 160,
    height: 160,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C84B4B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  feedbackContainer: {
    marginTop: 16,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default TrueFalseCard
