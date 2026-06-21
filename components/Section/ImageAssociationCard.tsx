import { AppColors } from '@/constants/theme/AppColors'
import { Question } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { useAuth } from '@/contexts/AuthContext'
import { Ionicons } from '@expo/vector-icons'
import { Image as ExpoImage } from 'expo-image'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ImageAssociationCardProps {
  question: Question
  onAnswer: (isCorrect: boolean, selectedAnswer: number) => void
  currentQuestion: number
  totalQuestions: number
  onExit?: () => void
}

const ImageAssociationCard: React.FC<ImageAssociationCardProps> = ({
  question,
  onAnswer,
  currentQuestion,
  totalQuestions,
  onExit,
}) => {
  const colors = AppColors()
  const insets = useSafeAreaInsets()
  const { token } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    setSelectedIndex(null)
    setHasSubmitted(false)
  }, [question.id])

  const imageSource = question.imageUrl
    ? {
        uri: question.imageUrl,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    : undefined

  // Variable number of options (2–4). Render only the options that exist so a
  // 3-option activity does not show an empty fourth card.
  const options = (question.options ?? []).filter(
    (option) => option != null && option !== ''
  )

  const isCorrect = selectedIndex === question.correctAnswer
  const isLastQuestion = currentQuestion >= totalQuestions
  const correctAnswerText = options[question.correctAnswer as number] ?? ''

  const handleSelect = (index: number) => {
    if (hasSubmitted) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIndex(index)
  }

  const handleSubmit = () => {
    if (selectedIndex === null || hasSubmitted) return
    setHasSubmitted(true)
    Haptics.notificationAsync(
      selectedIndex === question.correctAnswer
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    )
  }

  const handleAdvance = () => {
    if (selectedIndex === null) return
    onAnswer(isCorrect, selectedIndex)
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {imageSource && (
          <ExpoImage
            source={imageSource}
            style={styles.image}
            contentFit="cover"
          />
        )}

        <Text style={styles.instruction}>{question.question}</Text>

        <Text style={styles.counter}>
          {currentQuestion}/{totalQuestions}
        </Text>

        <View style={styles.grid}>
          {options.map((word, index) => {
            const isSelected = selectedIndex === index
            const isCorrectOption = index === question.correctAnswer
            const showCorrect = hasSubmitted && isCorrectOption
            const showWrong = hasSubmitted && isSelected && !isCorrectOption

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  isSelected && !hasSubmitted && styles.optionSelected,
                  showCorrect && styles.optionCorrect,
                  showWrong && styles.optionWrong,
                ]}
                onPress={() => handleSelect(index)}
                disabled={hasSubmitted}
                activeOpacity={0.78}
              >
                <Text
                  style={[
                    styles.optionText,
                    (isSelected || showCorrect || showWrong) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {word}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {!hasSubmitted ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.answerButton,
              {
                backgroundColor:
                  selectedIndex === null ? '#C1CFD7' : colors.primary,
              },
            ]}
            activeOpacity={0.82}
            disabled={selectedIndex === null}
            onPress={handleSubmit}
          >
            <Text
              style={[
                styles.answerButtonText,
                { color: selectedIndex === null ? '#809CAD' : '#FDFEFF' },
              ]}
            >
              {t('section.answer')}
            </Text>
          </TouchableOpacity>

          {onExit && (
            <TouchableOpacity activeOpacity={0.74} onPress={onExit}>
              <Text style={styles.exitText}>{t('section.exitActivity')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.panel,
            isCorrect ? styles.panelCorrect : styles.panelWrong,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
        >
          <View style={styles.panelHeaderRow}>
            <Ionicons
              name={isCorrect ? 'checkmark' : 'close'}
              size={24}
              color={isCorrect ? '#3A5313' : '#600000'}
            />
            <Text
              style={[
                styles.panelTitle,
                { color: isCorrect ? '#3A5313' : '#600000' },
              ]}
            >
              {isCorrect
                ? t('section.feedbackCorrectTitle')
                : t('section.feedbackWrongTitle')}
            </Text>
          </View>

          {!isCorrect && (
            <View style={styles.panelExplain}>
              <Text style={styles.panelCorrectLabel}>
                {t('section.correctAlternative')}
              </Text>
              <Text style={styles.panelCorrectText}>{correctAnswerText}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.panelButton,
              { backgroundColor: isCorrect ? '#70A31F' : '#D62B25' },
            ]}
            activeOpacity={0.85}
            onPress={handleAdvance}
          >
            <Text style={styles.panelButtonText}>
              {isLastQuestion
                ? t('section.finishActivity')
                : t('section.nextQuestion')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 24,
    paddingBottom: 16,
  },
  image: {
    width: 325,
    height: 325,
    borderRadius: 12,
  },
  instruction: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    color: '#141B1F',
    alignSelf: 'flex-start',
  },
  counter: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#28363E',
    alignSelf: 'flex-start',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  optionCard: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C1CFD7',
    backgroundColor: '#FAFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28363E',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionSelected: {
    backgroundColor: '#EBF0F2',
    borderColor: '#809CAD',
  },
  optionCorrect: {
    backgroundColor: '#C6F27E',
    borderColor: '#70A31F',
  },
  optionWrong: {
    backgroundColor: '#F28985',
    borderColor: '#D62B25',
  },
  optionText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    color: '#141B1F',
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: '700',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    gap: 24,
  },
  answerButton: {
    width: '100%',
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  exitText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#D62B25',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  panel: {
    marginHorizontal: -32,
    paddingHorizontal: 32,
    paddingTop: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  panelCorrect: {
    backgroundColor: '#E6FAC8',
  },
  panelWrong: {
    backgroundColor: '#FFDECC',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  panelTitle: {
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '700',
  },
  panelExplain: {
    marginTop: 12,
    gap: 8,
  },
  panelCorrectLabel: {
    fontSize: 16,
    lineHeight: 20.8,
    fontWeight: '600',
    color: '#600000',
  },
  panelCorrectText: {
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '400',
    color: '#600000',
  },
  panelButton: {
    width: '100%',
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelButtonText: {
    fontSize: 16,
    lineHeight: 20.8,
    fontWeight: '600',
    color: '#FDFEFF',
  },
})

export default ImageAssociationCard
