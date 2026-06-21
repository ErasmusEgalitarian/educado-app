import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { Question } from '@/data/mock-data'
import { t } from '@/i18n/config'
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

interface QuestionCardProps {
  question: Question
  onAnswer: (isCorrect: boolean, selectedAnswer: number | boolean) => void
  currentQuestion: number
  totalQuestions: number
  onExit?: () => void
  // Title shown as the small line at the top of the question card (course name).
  courseTitle?: string
  // Title shown as the bold line below the course name (section / lecture name).
  sectionTitle?: string
  // Visual/interaction variant:
  // - 'standalone' (default): blue question card + "Responder" button (quiz screen).
  // - 'video': plain question text below a video, options answer on tap (no card,
  //   no submit button) — used for post-video / in-video quizzes.
  variant?: 'standalone' | 'video'
  // When true, the card fills the available height: the question/answers scroll
  // while the Continue/Exit footer stays pinned to the bottom of the screen.
  // When false (e.g. a question shown inline during a video pause) the card keeps
  // its natural stacked layout so it can live inside an outer ScrollView.
  fillHeight?: boolean
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  currentQuestion,
  totalQuestions,
  onExit,
  courseTitle,
  sectionTitle,
  variant = 'standalone',
  fillHeight = false,
}) => {
  const isVideoVariant = variant === 'video'
  const colors = AppColors()
  const insets = useSafeAreaInsets()
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

  const isCorrect = selectedAnswer === question.correctAnswer
  const isLastQuestion = currentQuestion >= totalQuestions

  const correctAnswerText =
    question.type === 'true_false'
      ? question.correctAnswer
        ? t('section.true')
        : t('section.false')
      : (question.options[question.correctAnswer as number] ?? '')

  const handleSelectAnswer = (answer: number | boolean) => {
    if (hasSubmitted) return

    // In the video variant there is no separate "Responder" step — tapping an
    // option answers it immediately and reveals the feedback panel.
    if (isVideoVariant) {
      Haptics.notificationAsync(
        answer === question.correctAnswer
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      )
      setSelectedAnswer(answer)
      setHasSubmitted(true)
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedAnswer(answer)
  }

  const isTrueFalse = question.type === 'true_false'

  const handleSubmit = () => {
    if (selectedAnswer === null || hasSubmitted) return

    setHasSubmitted(true)
    Haptics.notificationAsync(
      selectedAnswer === question.correctAnswer
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    )
  }

  // True/false buttons answer immediately on tap (no separate submit step).
  const handleTrueFalseAnswer = (answer: boolean) => {
    if (hasSubmitted) return
    Haptics.notificationAsync(
      answer === question.correctAnswer
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    )
    setSelectedAnswer(answer)
    setHasSubmitted(true)
  }

  const handleAdvance = () => {
    if (selectedAnswer === null) return
    onAnswer(isCorrect, selectedAnswer)
  }

  const card = (
    <View style={styles.card}>
      {courseTitle ? (
        <Text style={styles.cardCourse} numberOfLines={1}>
          {courseTitle}
        </Text>
      ) : null}
      {sectionTitle ? (
        <Text style={styles.cardSection} numberOfLines={2}>
          {sectionTitle}
        </Text>
      ) : null}
      <Text style={styles.cardQuestion}>{question.question}</Text>
      <Text style={styles.cardCounter}>
        {currentQuestion}/{totalQuestions}
      </Text>
    </View>
  )

  const trueFalseButtons = (
    <View style={styles.trueFalseRow}>
      <TouchableOpacity
        style={[
          styles.trueFalseButton,
          { backgroundColor: '#C84B4B' },
          selectedAnswer === false && styles.selectedTrueFalse,
        ]}
        onPress={() =>
          isVideoVariant
            ? handleTrueFalseAnswer(false)
            : handleSelectAnswer(false)
        }
        disabled={hasSubmitted}
        activeOpacity={0.85}
      >
        <Ionicons name="close" size={44} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.trueFalseButton,
          { backgroundColor: '#8FB442' },
          selectedAnswer === true && styles.selectedTrueFalse,
        ]}
        onPress={() =>
          isVideoVariant
            ? handleTrueFalseAnswer(true)
            : handleSelectAnswer(true)
        }
        disabled={hasSubmitted}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark" size={44} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )

  const trueFalseBody = isVideoVariant ? (
    <>
      <Text style={styles.videoStatement}>{question.question}</Text>
      {trueFalseButtons}
    </>
  ) : (
    <>
      {imageSource ? (
        <View style={styles.tfImageContainer}>
          <ExpoImage
            source={imageSource}
            style={styles.image}
            contentFit="cover"
          />
        </View>
      ) : (
        <View style={styles.tfTeal} pointerEvents="none" />
      )}

      <Text style={styles.tfStatement}>{question.question}</Text>
      <Text style={styles.tfCounter}>
        {currentQuestion}/{totalQuestions}
      </Text>

      {trueFalseButtons}
    </>
  )

  // The video quiz shows the question as plain text above the options (no card,
  // no counter — the progress is conveyed by the top progress bar).
  const plainQuestion = (
    <Text style={styles.videoStatement}>{question.question}</Text>
  )

  const multipleChoiceBody = (
    <>
      {!isVideoVariant && imageSource && (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={imageSource}
            style={styles.image}
            contentFit="cover"
          />
        </View>
      )}

      {isVideoVariant ? (
        plainQuestion
      ) : (
        <View style={styles.cardWrap}>
          <View style={styles.tealBackdrop} pointerEvents="none" />
          {card}
        </View>
      )}

      <View
        style={[
          styles.answersContainer,
          isVideoVariant && styles.answersContainerVideo,
        ]}
      >
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrectOption = index === question.correctAnswer
          // After submitting, the confirmation colour lands on the answer
          // itself: the correct option turns green, a wrong pick turns red.
          const showCorrect = hasSubmitted && isCorrectOption
          const showWrong = hasSubmitted && isSelected && !isCorrectOption

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
                  isSelected && !hasSubmitted && styles.optionBadgeSelected,
                  showCorrect && styles.optionBadgeCorrect,
                  showWrong && styles.optionBadgeWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionBadgeText,
                    (isSelected || showCorrect || showWrong) &&
                      styles.optionBadgeTextSelected,
                  ]}
                >
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>

              <Text style={styles.answerText}>{option}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </>
  )

  const body = isTrueFalse ? trueFalseBody : multipleChoiceBody

  const submitFooter = (
    <>
      {!isVideoVariant && (
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor:
                selectedAnswer === null ? '#C1CFD7' : colors.primary,
            },
          ]}
          activeOpacity={0.82}
          disabled={selectedAnswer === null}
          onPress={handleSubmit}
        >
          <Text
            style={[
              styles.continueButtonText,
              { color: selectedAnswer === null ? '#809CAD' : '#FDFEFF' },
            ]}
          >
            {t('section.answer')}
          </Text>
        </TouchableOpacity>
      )}

      {onExit && (
        <TouchableOpacity activeOpacity={0.74} onPress={onExit}>
          <Text style={styles.exitText}>{t('section.exitActivity')}</Text>
        </TouchableOpacity>
      )}
    </>
  )

  const feedbackPanel = (
    <>
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
    </>
  )

  if (!fillHeight) {
    return (
      <View style={styles.container}>
        {body}
        {!hasSubmitted ? (
          <View style={styles.inlineFooter}>{submitFooter}</View>
        ) : (
          <View
            style={[
              styles.panel,
              isCorrect ? styles.panelCorrect : styles.panelWrong,
              styles.panelInline,
            ]}
          >
            {feedbackPanel}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.fillContainer}>
      <ScrollView
        style={styles.fillScroll}
        contentContainerStyle={styles.fillScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>

      {!hasSubmitted ? (
        <View
          style={[
            styles.pinnedFooter,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {submitFooter}
        </View>
      ) : (
        <View
          style={[
            styles.panel,
            isCorrect ? styles.panelCorrect : styles.panelWrong,
            styles.panelPinned,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
        >
          {feedbackPanel}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'stretch',
  },
  fillContainer: {
    flex: 1,
    width: '100%',
  },
  fillScroll: {
    flex: 1,
  },
  fillScrollContent: {
    alignItems: 'stretch',
    paddingBottom: 16,
  },
  pinnedFooter: {
    width: '100%',
    alignItems: 'stretch',
    paddingTop: 12,
  },
  inlineFooter: {
    width: '100%',
    alignItems: 'stretch',
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
  cardWrap: {
    width: '100%',
  },
  tealBackdrop: {
    position: 'absolute',
    top: -20,
    left: -32,
    right: -32,
    bottom: -30,
    backgroundColor: '#35A1B1',
    borderBottomRightRadius: 82,
  },
  card: {
    width: '100%',
    backgroundColor: '#D8EFF3',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 36,
  },
  cardCourse: {
    fontSize: 12,
    lineHeight: 15.6,
    fontWeight: '400',
    color: '#28363E',
  },
  cardSection: {
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '600',
    color: '#141B1F',
    marginTop: 6,
  },
  cardQuestion: {
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '400',
    color: '#141B1F',
    marginTop: 28,
  },
  cardCounter: {
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '600',
    color: '#141B1F',
    marginTop: 20,
  },
  answersContainer: {
    width: '100%',
    gap: 12,
    marginTop: 40,
  },
  answersContainerVideo: {
    marginTop: 20,
    gap: 8,
  },
  videoStatement: {
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '400',
    color: '#141B1F',
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
    backgroundColor: '#FAFEFF',
  },
  answerButtonSelected: {
    backgroundColor: '#EBF0F2',
    borderColor: '#809CAD',
  },
  answerButtonCorrect: {
    backgroundColor: '#C6F27E',
    borderColor: '#70A31F',
  },
  answerButtonWrong: {
    backgroundColor: '#F28985',
    borderColor: '#D62B25',
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
    backgroundColor: '#3A4E5A',
    borderColor: '#3A4E5A',
  },
  optionBadgeCorrect: {
    backgroundColor: '#70A31F',
    borderColor: '#70A31F',
  },
  optionBadgeWrong: {
    backgroundColor: '#D62B25',
    borderColor: '#D62B25',
  },
  optionBadgeText: {
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '600',
    color: '#809CAD',
  },
  optionBadgeTextSelected: {
    color: '#FDFEFF',
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '400',
    color: '#141B1F',
  },
  tfImageContainer: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#D9D9D9',
  },
  tfTeal: {
    height: 200,
    marginHorizontal: -32,
    backgroundColor: '#35A1B1',
    borderBottomRightRadius: 82,
  },
  tfStatement: {
    fontSize: 18,
    lineHeight: 23.4,
    fontWeight: '400',
    color: '#141B1F',
    marginTop: 37,
  },
  tfCounter: {
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '600',
    color: '#141B1F',
    marginTop: 24,
  },
  trueFalseRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 36,
  },
  trueFalseButton: {
    flex: 1,
    height: 277,
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
  exitText: {
    marginTop: 28,
    alignSelf: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#D62B25',
    textDecorationLine: 'underline',
  },
  panel: {
    paddingHorizontal: 32,
    paddingTop: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  panelInline: {
    alignSelf: 'stretch',
    marginHorizontal: -32,
    marginTop: 24,
    paddingBottom: 40,
  },
  panelPinned: {
    marginHorizontal: -32,
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

export default QuestionCard
