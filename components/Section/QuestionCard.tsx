import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { Question } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import { Image as ExpoImage } from 'expo-image'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface QuestionCardProps {
  question: Question
  onAnswer: (isCorrect: boolean, selectedAnswer: number | boolean) => void
  currentQuestion: number
  totalQuestions: number
  onExit?: () => void
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  currentQuestion,
  totalQuestions,
  onExit,
}) => {
  const colors = AppColors()
  const { token } = useAuth()
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(
    null
  )
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    setSelectedAnswer(null)
    setHasSubmitted(false)
  }, [question.id])

  const imageSource = question.imageUrl
    ? question.imageUrl.startsWith('http')
      ? {
          uri: question.imageUrl,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      : undefined
    : undefined

  const handleSelectAnswer = (answer: number | boolean) => {
    if (hasSubmitted) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedAnswer(answer)
  }

  const handleContinue = () => {
    if (selectedAnswer === null || hasSubmitted) return

    setHasSubmitted(true)
    const isCorrect = selectedAnswer === question.correctAnswer

    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    )

    setTimeout(() => {
      onAnswer(isCorrect, selectedAnswer)
    }, 900)
  }

  return (
    <View style={styles.container}>
      {imageSource && (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={imageSource}
            style={styles.image}
            contentFit="cover"
          />
        </View>
      )}

      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.answersContainer}>
        {question.type === 'true_false' ? (
          <View style={styles.trueFalseRow}>
            <TouchableOpacity
              style={[
                styles.trueFalseButton,
                { backgroundColor: '#C84B4B' },
                selectedAnswer === false && styles.selectedTrueFalse,
              ]}
              onPress={() => handleSelectAnswer(false)}
              disabled={hasSubmitted}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={72} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.trueFalseButton,
                { backgroundColor: '#8FB442' },
                selectedAnswer === true && styles.selectedTrueFalse,
              ]}
              onPress={() => handleSelectAnswer(true)}
              disabled={hasSubmitted}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={72} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          question.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = index === question.correctAnswer
            const showCorrect = hasSubmitted && isCorrect
            const showWrong = hasSubmitted && isSelected && !isCorrect

            return (
              <TouchableOpacity
                key={`${question.id}-${index}`}
                style={[
                  styles.answerButton,
                  isSelected && !hasSubmitted && styles.answerButtonSelected,
                  showCorrect && styles.answerButtonCorrect,
                  showWrong && styles.answerButtonWrong,
                ]}
                onPress={() => handleSelectAnswer(index)}
                disabled={hasSubmitted}
                activeOpacity={0.78}
              >
                <View
                  style={[
                    styles.optionBadge,
                    isSelected || hasSubmitted
                      ? styles.optionBadgeSelected
                      : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionBadgeText,
                      isSelected || hasSubmitted
                        ? styles.optionBadgeTextSelected
                        : undefined,
                    ]}
                  >
                    {String.fromCharCode(65 + index)}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.answerText,
                    (showCorrect || showWrong) && styles.answerTextInverse,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            )
          })
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          {
            backgroundColor:
              selectedAnswer === null || hasSubmitted
                ? '#C1CFD7'
                : colors.primary,
          },
        ]}
        activeOpacity={0.82}
        disabled={selectedAnswer === null || hasSubmitted}
        onPress={handleContinue}
      >
        <Text
          style={[
            styles.continueButtonText,
            {
              color:
                selectedAnswer === null || hasSubmitted ? '#809CAD' : '#FDFEFF',
            },
          ]}
        >
          {t('common.continue')}
        </Text>
      </TouchableOpacity>

      <Text style={styles.counterText}>
        {currentQuestion}/{totalQuestions}
      </Text>

      {onExit && (
        <TouchableOpacity activeOpacity={0.74} onPress={onExit}>
          <Text style={styles.exitText}>{t('section.exitActivity')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 470,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 22,
    backgroundColor: '#D9D9D9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  answersContainer: {
    width: '100%',
    gap: 8,
  },
  answerButton: {
    width: '100%',
    minHeight: 62,
    borderWidth: 1,
    borderColor: '#C1CFD7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FDFEFF',
  },
  answerButtonSelected: {
    borderColor: '#35A1B1',
    borderWidth: 2,
  },
  answerButtonCorrect: {
    backgroundColor: '#8FB442',
    borderColor: '#8FB442',
  },
  answerButtonWrong: {
    backgroundColor: '#C84B4B',
    borderColor: '#C84B4B',
  },
  optionBadge: {
    width: 31,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9FB4C1',
    backgroundColor: '#EBF0F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadgeSelected: {
    backgroundColor: '#246670',
    borderColor: '#246670',
  },
  optionBadgeText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#4E6879',
  },
  optionBadgeTextSelected: {
    color: '#FDFEFF',
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    color: '#141B1F',
  },
  answerTextInverse: {
    color: '#FDFEFF',
  },
  trueFalseRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  trueFalseButton: {
    flex: 1,
    height: 220,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTrueFalse: {
    transform: [{ scale: 0.98 }],
  },
  continueButton: {
    width: '100%',
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  counterText: {
    marginTop: 16,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#000000',
  },
  exitText: {
    marginTop: 28,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#D62B25',
    textDecorationLine: 'underline',
  },
})

export default QuestionCard
