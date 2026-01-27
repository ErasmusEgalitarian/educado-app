import ButtonPrimary from '@/components/Common/ButtonPrimary'
import QuestionCard from '@/components/Section/QuestionCard'
import VideoPlayer from '@/components/Section/VideoPlayer'
import { AppColors } from '@/constants/theme/AppColors'
import { getCourseById, getNextSection, getSectionById } from '@/data/mock-data'
import { t } from '@/i18n/config'
import {
  hasPassedCourse,
  isCourseCompleted,
  markCourseCompleted,
  saveSectionProgress,
} from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Phase = 'video' | 'questions' | 'results'

export default function SectionScreen() {
  const { courseId, sectionId } = useLocalSearchParams<{
    courseId: string
    sectionId: string
  }>()
  const router = useRouter()
  const colors = AppColors()
  const insets = useSafeAreaInsets()

  const course = getCourseById(courseId)
  const section = getSectionById(courseId, sectionId)

  const [phase, setPhase] = useState<Phase>('video')
  const [videoWatchPercentage, setVideoWatchPercentage] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ isCorrect: boolean; answer: number | boolean }>
  >([])

  // Reset all state when sectionId changes (navigating to a new section)
  useEffect(() => {
    setPhase('video')
    setVideoWatchPercentage(0)
    setCurrentQuestionIndex(0)
    setAnswers([])
  }, [sectionId])

  if (!course || !section) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <Text style={{ color: colors.textPrimary }}>
          {t('errors.loadSection')}
        </Text>
      </View>
    )
  }

  const handleVideoProgress = (percentage: number) => {
    setVideoWatchPercentage(percentage)
  }

  const handleReadyToAnswer = () => {
    setPhase('questions')
  }

  const handleAnswer = (isCorrect: boolean, answer: number | boolean) => {
    const newAnswers = [...answers, { isCorrect, answer }]
    setAnswers(newAnswers)

    // Move to next question or show results
    if (currentQuestionIndex < section.questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }, 1500)
    } else {
      // All questions answered, show results
      setTimeout(() => {
        setPhase('results')
      }, 1500)
    }
  }

  const handleCompleteSection = async () => {
    const correctAnswers = answers.filter((a) => a.isCorrect).length
    const totalQuestions = section.questions.length

    // Save progress
    await saveSectionProgress(
      courseId,
      sectionId,
      correctAnswers,
      totalQuestions
    )

    // Check if all sections are completed
    const nextSection = getNextSection(courseId, sectionId)
    const courseCompleted = await isCourseCompleted(
      courseId,
      course.sections.length
    )

    if (courseCompleted) {
      // Check if user has passed based on score threshold
      const passed = await hasPassedCourse(
        courseId,
        course.sections.length,
        course.passingThreshold
      )

      await markCourseCompleted(courseId)

      if (passed) {
        // User passed - show certificate
        router.replace(`/(tabs)/courses/${courseId}/certificate`)
      } else {
        // User completed but didn't pass - go back to course details
        router.replace(`/(tabs)/courses/${courseId}`)
      }
    } else if (nextSection) {
      // Go to next section
      router.replace(`/(tabs)/courses/${courseId}/section/${nextSection.id}`)
    } else {
      // Go back to course details
      router.replace(`/(tabs)/courses/${courseId}`)
    }
  }

  const correctAnswersCount = answers.filter((a) => a.isCorrect).length
  const scorePercentage = Math.round(
    (correctAnswersCount / section.questions.length) * 100
  )

  return (
    <View
      key={sectionId}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace(`/(tabs)/courses/${courseId}`)}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {section.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {phase === 'video' && (
        <>
          <ScrollView
            style={styles.videoContent}
            showsVerticalScrollIndicator={false}
          >
            <VideoPlayer
              key={sectionId}
              videoUrl={section.videoUrl}
              onProgressUpdate={handleVideoProgress}
              minimumWatchPercentage={80}
            />

            <View style={styles.videoInfo}>
              <Text
                style={[styles.sectionTitle, { color: colors.textPrimary }]}
              >
                {section.title}
              </Text>
              <Text
                style={[
                  styles.sectionDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Watch the video to learn about this topic. You'll need to watch
                at least 80% before answering questions.
              </Text>

              <View style={styles.questionsInfo}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.questionsText,
                    { color: colors.textSecondary },
                  ]}
                >
                  {section.questions.length} questions to answer after video
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.cardBackground,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <ButtonPrimary
              title={t('course.readyToAnswer')}
              onPress={handleReadyToAnswer}
              icon="checkmark"
              fullWidth
              disabled={videoWatchPercentage < 80}
            />
            {videoWatchPercentage < 80 && (
              <Text style={[styles.watchHint, { color: colors.textSecondary }]}>
                Watch {Math.round(80 - videoWatchPercentage)}% more to continue
              </Text>
            )}
          </View>
        </>
      )}

      {phase === 'questions' && (
        <View style={styles.questionsContainer}>
          <ScrollView
            style={styles.questionsScroll}
            contentContainerStyle={styles.questionsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <QuestionCard
              question={section.questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={section.questions.length}
            />
          </ScrollView>
        </View>
      )}

      {phase === 'results' && (
        <>
          <ScrollView
            contentContainerStyle={styles.resultsContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
              <Ionicons
                name={scorePercentage >= 70 ? 'trophy' : 'ribbon'}
                size={64}
                color={scorePercentage >= 70 ? colors.primary : colors.warning}
              />
              <Text
                style={[styles.scorePercentage, { color: colors.textPrimary }]}
              >
                {scorePercentage}%
              </Text>
            </View>

            <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>
              {scorePercentage >= 70 ? 'Great Job!' : 'Good Effort!'}
            </Text>

            <Text
              style={[styles.resultsSubtitle, { color: colors.textSecondary }]}
            >
              You answered {correctAnswersCount} out of{' '}
              {section.questions.length} questions correctly
            </Text>

            <View style={styles.resultsDetails}>
              {section.questions.map((question, index) => {
                const userAnswer = answers[index]
                const isCorrect = userAnswer?.isCorrect

                return (
                  <View
                    key={question.id}
                    style={[
                      styles.resultItem,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.resultHeader}>
                      <Text
                        style={[
                          styles.resultQuestionNumber,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Question {index + 1}
                      </Text>
                      <Ionicons
                        name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={24}
                        color={isCorrect ? colors.success : colors.error}
                      />
                    </View>
                    <Text
                      style={[
                        styles.resultQuestion,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {question.question}
                    </Text>
                  </View>
                )
              })}
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.cardBackground,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            <ButtonPrimary
              title="Continue"
              onPress={handleCompleteSection}
              icon="arrow-forward"
              fullWidth
              variant="primary"
            />
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 44,
  },
  videoContent: {
    flex: 1,
  },
  videoInfo: {
    padding: 24,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  questionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionsText: {
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  watchHint: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  questionsContainer: {
    flex: 1,
  },
  questionsScroll: {
    flex: 1,
  },
  questionsScrollContent: {
    paddingBottom: 140,
  },
  resultsContent: {
    padding: 24,
    paddingBottom: 140,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  resultsDetails: {
    gap: 12,
  },
  resultItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultQuestionNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultQuestion: {
    fontSize: 16,
  },
})
