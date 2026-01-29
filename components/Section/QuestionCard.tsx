import { AppColors } from '@/constants/theme/AppColors'
import { Question } from '@/data/mock-data'
import { imageLoader } from '@/utils/image-loader'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ButtonPrimary from '../Common/ButtonPrimary'

interface QuestionCardProps {
  question: Question
  onAnswer: (isCorrect: boolean, selectedAnswer: number | boolean) => void
  showResult?: boolean
  currentQuestion: number
  totalQuestions: number
  imageUrl?: string // Optional image asset name (without extension)
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  currentQuestion,
  totalQuestions,
  imageUrl,
}) => {
  const colors = AppColors()
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(
    null
  )
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setHasSubmitted(false)
  }, [question.id])

  const handleSelectAnswer = (answer: number | boolean) => {
    if (hasSubmitted) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedAnswer(answer)
  }

  const handleContinue = () => {
    if (selectedAnswer === null || hasSubmitted) return

    setHasSubmitted(true)

    const isCorrect = selectedAnswer === question.correctAnswer

    // Haptic feedback
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }

    // Delay to show feedback before calling onAnswer
    setTimeout(() => {
      onAnswer(isCorrect, selectedAnswer)
    }, 1000)
  }

  const getButtonStyle = (answer: number | boolean) => {
    const isSelected = selectedAnswer === answer
    const isCorrect = answer === question.correctAnswer

    // Before submission - highlight selected answer
    if (!hasSubmitted) {
      if (isSelected) {
        return [
          styles.answerButton,
          styles.selectedAnswer,
          { borderColor: colors.primary, borderWidth: 3 },
        ]
      }
      return [styles.answerButton, { borderColor: colors.border }]
    }

    // After submission - show correct/incorrect
    if (isSelected) {
      if (isCorrect) {
        return [
          styles.answerButton,
          styles.correctAnswer,
          { backgroundColor: colors.success, borderColor: colors.success },
        ]
      } else {
        return [
          styles.answerButton,
          styles.incorrectAnswer,
          { backgroundColor: colors.error, borderColor: colors.error },
        ]
      }
    }

    // Always show the correct answer after submission
    if (hasSubmitted && isCorrect) {
      return [
        styles.answerButton,
        styles.correctAnswer,
        { backgroundColor: colors.success, borderColor: colors.success },
      ]
    }

    return [styles.answerButton, { borderColor: colors.border, opacity: 0.5 }]
  }

  const getButtonTextStyle = (answer: number | boolean) => {
    const isSelected = selectedAnswer === answer
    const isCorrect = answer === question.correctAnswer

    // After submission, use white text for selected (correct or incorrect) or correct answers
    if (hasSubmitted) {
      if (isSelected || isCorrect) {
        return [styles.answerText, { color: colors.textLight }]
      }
    }

    return [styles.answerText, { color: colors.textPrimary }]
  }

  const getAnswerIcon = (answer: number | boolean) => {
    if (!hasSubmitted) return null

    const isSelected = selectedAnswer === answer
    const isCorrect = answer === question.correctAnswer

    if (isSelected) {
      if (isCorrect) {
        return (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={colors.textLight}
          />
        )
      } else {
        return (
          <Ionicons name="close-circle" size={24} color={colors.textLight} />
        )
      }
    }

    // Always show checkmark on correct answer after submission
    if (hasSubmitted && isCorrect) {
      return (
        <Ionicons name="checkmark-circle" size={24} color={colors.textLight} />
      )
    }

    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.questionNumber, { color: colors.textSecondary }]}>
          Question {currentQuestion} of {totalQuestions}
        </Text>
        {question.icon && (
          <Ionicons
            name={question.icon as keyof typeof Ionicons.glyphMap}
            size={32}
            color={colors.primary}
          />
        )}
      </View>

      {/* Optional Image */}
      {imageUrl && (
        <View style={styles.imageContainer}>
          <Image
            source={imageLoader(imageUrl)}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: colors.textPrimary }]}>
          {question.question}
        </Text>
        <TouchableOpacity
          style={[
            styles.speakerButton,
            { backgroundColor: colors.primaryLight },
          ]}
          onPress={() => {
            // TODO: Implement text-to-speech functionality
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }}
        >
          <Ionicons name="volume-high" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.answersContainer}>
        {question.type === 'true_false' ? (
          <>
            <TouchableOpacity
              style={getButtonStyle(true)}
              onPress={() => handleSelectAnswer(true)}
              disabled={hasSubmitted}
              activeOpacity={0.7}
            >
              <View style={styles.answerContent}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={28}
                  color={hasSubmitted ? colors.textLight : colors.success}
                />
                <Text style={getButtonTextStyle(true)}>True</Text>
                {getAnswerIcon(true)}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={getButtonStyle(false)}
              onPress={() => handleSelectAnswer(false)}
              disabled={hasSubmitted}
              activeOpacity={0.7}
            >
              <View style={styles.answerContent}>
                <Ionicons
                  name="close-circle-outline"
                  size={28}
                  color={hasSubmitted ? colors.textLight : colors.error}
                />
                <Text style={getButtonTextStyle(false)}>False</Text>
                {getAnswerIcon(false)}
              </View>
            </TouchableOpacity>
          </>
        ) : (
          question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={getButtonStyle(index)}
              onPress={() => handleSelectAnswer(index)}
              disabled={hasSubmitted}
              activeOpacity={0.7}
            >
              <View style={styles.answerContent}>
                <View
                  style={[
                    styles.optionBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.optionLetter}>
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>
                <Text style={getButtonTextStyle(index)}>{option}</Text>
                {getAnswerIcon(index)}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <ButtonPrimary
          title="Continue"
          onPress={handleContinue}
          icon="arrow-forward"
          disabled={selectedAnswer === null || hasSubmitted}
          fullWidth
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#D3C5B8',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 32,
    flex: 1,
  },
  speakerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  answersContainer: {
    gap: 12,
    marginBottom: 24,
  },
  answerButton: {
    minHeight: 70,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#FDFEFF',
  },
  selectedAnswer: {
    backgroundColor: '#D8EFF3',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  correctAnswer: {
    borderWidth: 0,
  },
  incorrectAnswer: {
    borderWidth: 0,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueContainer: {
    marginTop: 8,
  },
})

export default QuestionCard
