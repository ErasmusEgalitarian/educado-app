import ButtonPrimary from '@/components/Common/ButtonPrimary'
import QuestionCard from '@/components/Section/QuestionCard'
import TextReadingCard from '@/components/Section/TextReadingCard'
import VideoPlayer from '@/components/Section/VideoPlayer'
import VideoPlayerWithPauses from '@/components/Section/VideoPlayerWithPauses'
import { AppColors } from '@/constants/theme/AppColors'
import { useCourse } from '@/hooks/useCourses'
import {
  useCompleteCourse,
  useSaveSectionProgress,
} from '@/hooks/useProgress'
import { t } from '@/i18n/config'
import {
  saveSectionProgress as saveLocalSectionProgress,
  isCourseCompleted as checkLocalCourseCompleted,
  markCourseCompleted as markLocalCourseCompleted,
} from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Phase = 'text' | 'video' | 'questions' | 'results'

export default function SectionScreen() {
  const { courseId, sectionId } = useLocalSearchParams<{
    courseId: string
    sectionId: string
  }>()
  const router = useRouter()
  const colors = AppColors()
  const insets = useSafeAreaInsets()

  const { data: course } = useCourse(courseId)
  const saveSectionProgressMutation = useSaveSectionProgress()
  const markCourseCompletedMutation = useCompleteCourse()

  const section = useMemo(() => {
    return course?.sections.find((s) => s.id === sectionId)
  }, [course, sectionId])

  const nextSection = useMemo(() => {
    if (!course || !sectionId) return null
    const currentIndex = course.sections.findIndex((s) => s.id === sectionId)
    if (currentIndex === -1 || currentIndex === course.sections.length - 1) {
      return null
    }
    return course.sections[currentIndex + 1]
  }, [course, sectionId])

  const hasTextPages = Boolean(
    section?.textPages && section.textPages.length > 0
  )
  const hasVideo = Boolean(section?.videoUrl)
  const hasQuestions = Boolean(
    section?.questions && section.questions.length > 0
  )
  const hasVideoPauseQuestions = Boolean(
    section?.videoPauseQuestions && section.videoPauseQuestions.length > 0
  )

  // Determine initial phase
  const getInitialPhase = (): Phase => {
    if (hasTextPages) return 'text'
    if (hasVideo) return 'video'
    if (hasQuestions) return 'questions'
    return 'results'
  }

  const [phase, setPhase] = useState<Phase>(getInitialPhase())
  const [videoWatchPercentage, setVideoWatchPercentage] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ isCorrect: boolean; answer: number | boolean }>
  >([])

  // Video pause state
  const [isPausedForQuestion, setIsPausedForQuestion] = useState(false)
  const [currentPauseQuestionIndex, setCurrentPauseQuestionIndex] = useState<
    number | null
  >(null)
  const [pauseAnswers, setPauseAnswers] = useState<
    Array<{ isCorrect: boolean; answer: number | boolean }>
  >([])

  // Reset all state when sectionId changes
  useEffect(() => {
    setVideoWatchPercentage(0)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setIsPausedForQuestion(false)
    setCurrentPauseQuestionIndex(null)
    setPauseAnswers([])
    // Recalculate initial phase
    const newHasText = Boolean(
      section?.textPages && section.textPages.length > 0
    )
    const newHasVideo = Boolean(section?.videoUrl)
    const newHasQuestions = Boolean(
      section?.questions && section.questions.length > 0
    )
    if (newHasText) setPhase('text')
    else if (newHasVideo) setPhase('video')
    else if (newHasQuestions) setPhase('questions')
    else setPhase('results')
  }, [sectionId, section])

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

  const questions = section.questions ?? []
  const videoPauseQuestions = section.videoPauseQuestions ?? []

  // All questions combined for score calculation
  const allQuestionsCount = questions.length + videoPauseQuestions.length
  const allAnswers = [...pauseAnswers, ...answers]

  const handleTextComplete = () => {
    if (hasVideo) {
      setPhase('video')
    } else if (hasQuestions) {
      setPhase('questions')
    } else {
      setPhase('results')
    }
  }

  const handleVideoProgress = (percentage: number) => {
    setVideoWatchPercentage(percentage)
  }

  const handleReadyToAnswer = () => {
    if (questions.length === 0) {
      setPhase('results')
      return
    }
    setPhase('questions')
  }

  // Video pause handlers
  const handlePauseReached = useCallback(
    (timestamp: number) => {
      const index = videoPauseQuestions.findIndex(
        (vpq) => vpq.pauseTimestamp === timestamp
      )
      if (index !== -1) {
        setCurrentPauseQuestionIndex(index)
        setIsPausedForQuestion(true)
      }
    },
    [videoPauseQuestions]
  )

  const handlePauseQuestionAnswer = (
    isCorrect: boolean,
    answer: number | boolean
  ) => {
    setPauseAnswers((prev) => [...prev, { isCorrect, answer }])
    // Resume video after a short delay
    setTimeout(() => {
      setIsPausedForQuestion(false)
      setCurrentPauseQuestionIndex(null)
    }, 1500)
  }

  const handleVideoComplete = useCallback(() => {
    setVideoWatchPercentage(100)
  }, [])

  const handleAnswer = (isCorrect: boolean, answer: number | boolean) => {
    const newAnswers = [...answers, { isCorrect, answer }]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }, 1500)
    } else {
      setTimeout(() => {
        setPhase('results')
      }, 1500)
    }
  }

  const handleCompleteSection = async () => {
    const correctAnswers = allAnswers.filter((a) => a.isCorrect).length
    const totalQuestions = allQuestionsCount

    // Save progress locally (for score tracking)
    await saveLocalSectionProgress(
      courseId,
      sectionId,
      correctAnswers,
      totalQuestions
    )

    // Save progress to API (completion only)
    try {
      await saveSectionProgressMutation.mutateAsync({
        courseId,
        sectionId,
        score: correctAnswers,
        totalQuestions: totalQuestions,
      })
    } catch {
      // Continue even if API save fails
    }

    // Check if course is completed
    const courseCompleted = await checkLocalCourseCompleted(
      courseId,
      course.sections.length
    )

    if (courseCompleted) {
      await markLocalCourseCompleted(courseId)

      // Sync completion to API
      let isOnline = true
      try {
        await markCourseCompletedMutation.mutateAsync(courseId)
      } catch {
        isOnline = false
      }

      // Skip review when offline — go straight to certificate
      if (isOnline) {
        router.replace(`/(tabs)/courses/${courseId}/review`)
      } else {
        router.replace(`/(tabs)/courses/${courseId}/certificate`)
      }
    } else if (nextSection) {
      router.replace(`/(tabs)/courses/${courseId}/section/${nextSection.id}`)
    } else {
      router.replace(`/(tabs)/courses/${courseId}`)
    }
  }

  const correctAnswersCount = allAnswers.filter((a) => a.isCorrect).length
  const scorePercentage =
    allQuestionsCount > 0
      ? Math.round((correctAnswersCount / allQuestionsCount) * 100)
      : 100

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

      {/* Text Reading Phase */}
      {phase === 'text' && section.textPages && (
        <TextReadingCard
          textPages={section.textPages}
          courseTitle={course.title}
          sectionTitle={section.title}
          onComplete={handleTextComplete}
        />
      )}

      {/* Video Phase */}
      {phase === 'video' && (
        <>
          <ScrollView
            style={styles.videoContent}
            showsVerticalScrollIndicator={false}
          >
            {hasVideoPauseQuestions ? (
              <>
                <VideoPlayerWithPauses
                  key={sectionId}
                  videoUrl={section.videoUrl ?? ''}
                  pauseTimestamps={videoPauseQuestions.map(
                    (vpq) => vpq.pauseTimestamp
                  )}
                  onPauseReached={handlePauseReached}
                  isPaused={isPausedForQuestion}
                  onResume={() => setIsPausedForQuestion(false)}
                  onVideoComplete={handleVideoComplete}
                />

                {/* Show question card overlay when paused */}
                {isPausedForQuestion && currentPauseQuestionIndex !== null && (
                  <View style={styles.pauseQuestionContainer}>
                    <QuestionCard
                      question={
                        videoPauseQuestions[currentPauseQuestionIndex].question
                      }
                      onAnswer={handlePauseQuestionAnswer}
                      currentQuestion={currentPauseQuestionIndex + 1}
                      totalQuestions={videoPauseQuestions.length}
                    />
                  </View>
                )}
              </>
            ) : (
              <VideoPlayer
                key={sectionId}
                videoUrl={section.videoUrl ?? ''}
                onProgressUpdate={handleVideoProgress}
                minimumWatchPercentage={80}
              />
            )}

            {!isPausedForQuestion && (
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
                  {t('section.videoDescription')}
                </Text>

                {(questions.length > 0 || videoPauseQuestions.length > 0) && (
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
                      {t('section.questionsToAnswer', {
                        count: allQuestionsCount,
                      })}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {!isPausedForQuestion && (
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
                disabled={
                  hasVideoPauseQuestions
                    ? videoWatchPercentage < 100
                    : videoWatchPercentage < 80
                }
              />
              {videoWatchPercentage < (hasVideoPauseQuestions ? 100 : 80) && (
                <Text
                  style={[styles.watchHint, { color: colors.textSecondary }]}
                >
                  {t('section.watchMore', {
                    percent: Math.round(
                      (hasVideoPauseQuestions ? 100 : 80) - videoWatchPercentage
                    ),
                  })}
                </Text>
              )}
            </View>
          )}
        </>
      )}

      {/* Questions Phase */}
      {phase === 'questions' && (
        <View style={styles.questionsContainer}>
          <ScrollView
            style={styles.questionsScroll}
            contentContainerStyle={styles.questionsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <QuestionCard
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              currentQuestion={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          </ScrollView>
        </View>
      )}

      {/* Results Phase */}
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
              {scorePercentage >= 70
                ? t('results.greatJob')
                : t('results.goodEffort')}
            </Text>

            <Text
              style={[styles.resultsSubtitle, { color: colors.textSecondary }]}
            >
              {t('section.answeredCorrectly', {
                correct: correctAnswersCount,
                total: allQuestionsCount,
              })}
            </Text>

            <View style={styles.resultsDetails}>
              {/* Video pause questions results */}
              {videoPauseQuestions.map((vpq, index) => {
                const userAnswer = pauseAnswers[index]
                const isCorrect = userAnswer?.isCorrect

                return (
                  <View
                    key={vpq.question.id}
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
                        {t('section.questionNumber', { index: index + 1 })}
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
                      {vpq.question.question}
                    </Text>
                  </View>
                )
              })}

              {/* Regular questions results */}
              {questions.map((question, index) => {
                const userAnswer = answers[index]
                const isCorrect = userAnswer?.isCorrect
                const globalIndex = videoPauseQuestions.length + index

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
                        {t('section.questionNumber', {
                          index: globalIndex + 1,
                        })}
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
              title={t('common.continue')}
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
  pauseQuestionContainer: {
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
