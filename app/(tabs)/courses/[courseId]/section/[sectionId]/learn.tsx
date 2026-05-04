import QuestionCard from '@/components/Section/QuestionCard'
import SectionProgressBar from '@/components/Section/SectionProgressBar'
import TextReadingCard from '@/components/Section/TextReadingCard'
import VideoPlayer from '@/components/Section/VideoPlayer'
import VideoPlayerWithPauses from '@/components/Section/VideoPlayerWithPauses'
import { AppColors } from '@/constants/theme/AppColors'
import { useCourse } from '@/hooks/useCourses'
import { useCompleteCourse, useSaveSectionProgress } from '@/hooks/useProgress'
import { t } from '@/i18n/config'
import {
  isCourseCompleted as checkLocalCourseCompleted,
  markCourseCompleted as markLocalCourseCompleted,
  saveSectionProgress as saveLocalSectionProgress,
} from '@/utils/progress-storage'
import {
  getInitialSectionPhase,
  getSectionPhaseItems,
  SectionPhaseId,
} from '@/utils/section-phases'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Phase = SectionPhaseId | 'results'

export default function SectionLearningScreen() {
  const { courseId, sectionId, startPhase } = useLocalSearchParams<{
    courseId: string
    sectionId: string
    startPhase?: string
  }>()
  const router = useRouter()
  const colors = AppColors()
  const insets = useSafeAreaInsets()

  const { data: course } = useCourse(courseId)
  const saveSectionProgressMutation = useSaveSectionProgress()
  const markCourseCompletedMutation = useCompleteCourse()

  const section = useMemo(
    () => course?.sections.find((item) => item.id === sectionId),
    [course, sectionId]
  )

  const nextSection = useMemo(() => {
    if (!course) return null
    const currentIndex = course.sections.findIndex(
      (item) => item.id === sectionId
    )
    if (currentIndex === -1 || currentIndex === course.sections.length - 1) {
      return null
    }
    return course.sections[currentIndex + 1]
  }, [course, sectionId])

  const phaseItems = useMemo(
    () => (section ? getSectionPhaseItems(section) : []),
    [section]
  )

  const hasVideo = Boolean(section?.videoUrl)
  const hasQuestions = Boolean(
    section?.questions && section.questions.length > 0
  )
  const hasVideoPauseQuestions = Boolean(
    section?.videoPauseQuestions && section.videoPauseQuestions.length > 0
  )

  const getInitialPhase = useCallback((): Phase => {
    if (!section) return 'questions'

    const requestedPhase = startPhase as SectionPhaseId | undefined
    const defaultPhase = getInitialSectionPhase(section)
    const availablePhaseIds = new Set(phaseItems.map((item) => item.id))

    if (requestedPhase && availablePhaseIds.has(requestedPhase)) {
      return requestedPhase
    }

    return defaultPhase
  }, [phaseItems, section, startPhase])

  const [phase, setPhase] = useState<Phase>('questions')
  const [videoWatchPercentage, setVideoWatchPercentage] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<
    Array<{ isCorrect: boolean; answer: number | boolean }>
  >([])
  const [isPausedForQuestion, setIsPausedForQuestion] = useState(false)
  const [currentPauseQuestionIndex, setCurrentPauseQuestionIndex] = useState<
    number | null
  >(null)
  const [pauseAnswers, setPauseAnswers] = useState<
    Array<{ isCorrect: boolean; answer: number | boolean }>
  >([])
  const [isExitModalVisible, setIsExitModalVisible] = useState(false)

  useEffect(() => {
    if (!section) return

    setPhase(getInitialPhase())
    setVideoWatchPercentage(0)
    setCurrentQuestionIndex(0)
    setAnswers([])
    setIsPausedForQuestion(false)
    setCurrentPauseQuestionIndex(null)
    setPauseAnswers([])
  }, [getInitialPhase, section, sectionId])

  if (!course || !section) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.backgroundPrimary }]}
      >
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {t('errors.loadSection')}
        </Text>
      </View>
    )
  }

  const questions = useMemo(() => section.questions ?? [], [section.questions])
  const videoPauseQuestions = useMemo(
    () => section.videoPauseQuestions ?? [],
    [section.videoPauseQuestions]
  )
  const allQuestionsCount = questions.length + videoPauseQuestions.length
  const allAnswers = [...pauseAnswers, ...answers]
  const currentPhaseIndex =
    phase === 'results'
      ? Math.max(phaseItems.length - 1, 0)
      : Math.max(
          phaseItems.findIndex((item) => item.id === phase),
          0
        )

  const handleTextComplete = () => {
    if (hasVideo) {
      setPhase('video')
      return
    }
    if (hasQuestions) {
      setPhase('questions')
      return
    }
    setPhase('results')
  }

  const handlePauseReached = useCallback(
    (timestamp: number) => {
      const index = videoPauseQuestions.findIndex(
        (item) => item.pauseTimestamp === timestamp
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
    setTimeout(() => {
      setIsPausedForQuestion(false)
      setCurrentPauseQuestionIndex(null)
    }, 800)
  }

  const handleVideoComplete = useCallback(() => {
    setVideoWatchPercentage(100)
  }, [])

  const handleAnswer = (isCorrect: boolean, answer: number | boolean) => {
    const newAnswers = [...answers, { isCorrect, answer }]
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((previous) => previous + 1)
      return
    }

    setPhase('results')
  }

  const handleReadyToAnswer = () => {
    if (questions.length === 0) {
      setPhase('results')
      return
    }

    setPhase('questions')
  }

  const handleCompleteSection = async () => {
    const correctAnswers = allAnswers.filter((item) => item.isCorrect).length

    await saveLocalSectionProgress(
      courseId,
      sectionId,
      correctAnswers,
      allQuestionsCount
    )

    try {
      await saveSectionProgressMutation.mutateAsync({
        courseId,
        sectionId,
        score: correctAnswers,
        totalQuestions: allQuestionsCount,
      })
    } catch {
      // Keep local flow progressing even when the API call fails.
    }

    const courseCompleted = await checkLocalCourseCompleted(
      courseId,
      course.sections.length
    )

    if (courseCompleted) {
      await markLocalCourseCompleted(courseId)

      let isOnline = true
      try {
        await markCourseCompletedMutation.mutateAsync(courseId)
      } catch {
        isOnline = false
      }

      if (isOnline) {
        router.replace(`/(tabs)/courses/${courseId}/review`)
      } else {
        router.replace(`/(tabs)/courses/${courseId}/certificate`)
      }
      return
    }

    if (nextSection) {
      router.replace(`/(tabs)/courses/${courseId}/section/${nextSection.id}`)
      return
    }

    router.replace(`/(tabs)/courses/${courseId}`)
  }

  const correctAnswersCount = allAnswers.filter((item) => item.isCorrect).length
  const scorePercentage =
    allQuestionsCount > 0
      ? Math.round((correctAnswersCount / allQuestionsCount) * 100)
      : 100
  const isMediaStage = phase === 'video' || phase === 'questions'
  const isQuestionLocked =
    phase === 'video' &&
    !isPausedForQuestion &&
    (hasVideoPauseQuestions
      ? videoWatchPercentage < 100
      : videoWatchPercentage < 80)

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      {isMediaStage && <View style={styles.mediaBackdrop} />}

      <View style={[styles.progressShell, { paddingTop: insets.top + 12 }]}>
        <SectionProgressBar
          currentActivity={currentPhaseIndex}
          totalActivities={Math.max(phaseItems.length, 1)}
          onBack={() => setIsExitModalVisible(true)}
          textColor={phase === 'text' ? '#4E6879' : '#141B1F'}
        />
      </View>

      <View style={styles.stageContainer}>
        {phase === 'text' && section.textPages && (
          <TextReadingCard
            textPages={section.textPages}
            courseTitle={course.title}
            sectionTitle={section.title}
            onComplete={handleTextComplete}
            onExit={() => setIsExitModalVisible(true)}
          />
        )}

        {phase === 'video' && (
          <ScrollView
            contentContainerStyle={[
              styles.videoContent,
              { paddingBottom: Math.max(insets.bottom, 32) + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {hasVideoPauseQuestions ? (
              <VideoPlayerWithPauses
                key={sectionId}
                videoUrl={section.videoUrl ?? ''}
                pauseTimestamps={videoPauseQuestions.map(
                  (item) => item.pauseTimestamp
                )}
                onPauseReached={handlePauseReached}
                isPaused={isPausedForQuestion}
                onResume={() => setIsPausedForQuestion(false)}
                onVideoComplete={handleVideoComplete}
              />
            ) : (
              <VideoPlayer
                key={sectionId}
                videoUrl={section.videoUrl ?? ''}
                onProgressUpdate={setVideoWatchPercentage}
                minimumWatchPercentage={80}
              />
            )}

            {isPausedForQuestion && currentPauseQuestionIndex !== null ? (
              <View style={styles.questionBlock}>
                <QuestionCard
                  question={
                    videoPauseQuestions[currentPauseQuestionIndex].question
                  }
                  onAnswer={handlePauseQuestionAnswer}
                  currentQuestion={currentPauseQuestionIndex + 1}
                  totalQuestions={videoPauseQuestions.length}
                  onExit={() => setIsExitModalVisible(true)}
                />
              </View>
            ) : (
              <View style={styles.videoFooter}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: isQuestionLocked
                        ? '#C1CFD7'
                        : colors.primary,
                    },
                  ]}
                  activeOpacity={0.82}
                  disabled={isQuestionLocked}
                  onPress={handleReadyToAnswer}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      {
                        color: isQuestionLocked ? '#809CAD' : '#FDFEFF',
                      },
                    ]}
                  >
                    {t('course.readyToAnswer')}
                  </Text>
                </TouchableOpacity>

                {isQuestionLocked && (
                  <Text style={styles.helperText}>
                    {t('section.watchMore', {
                      percent: Math.round(
                        (hasVideoPauseQuestions ? 100 : 80) -
                          videoWatchPercentage
                      ),
                    })}
                  </Text>
                )}

                <TouchableOpacity
                  activeOpacity={0.74}
                  onPress={() => setIsExitModalVisible(true)}
                >
                  <Text style={styles.exitText}>
                    {t('section.exitActivity')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {phase === 'questions' && (
          <ScrollView
            contentContainerStyle={[
              styles.questionStageContent,
              { paddingBottom: Math.max(insets.bottom, 28) + 24 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.questionBlock}>
              <QuestionCard
                question={questions[currentQuestionIndex]}
                onAnswer={handleAnswer}
                currentQuestion={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                onExit={() => setIsExitModalVisible(true)}
              />
            </View>
          </ScrollView>
        )}

        {phase === 'results' && (
          <View style={styles.resultsContainer}>
            <View style={styles.resultsCard}>
              <View
                style={[
                  styles.resultsIcon,
                  {
                    backgroundColor:
                      scorePercentage >= 70 ? '#E6F5F7' : '#FFF4E5',
                  },
                ]}
              >
                <Ionicons
                  name={scorePercentage >= 70 ? 'trophy' : 'sparkles'}
                  size={48}
                  color={scorePercentage >= 70 ? colors.primary : '#F4A640'}
                />
              </View>

              <Text style={styles.resultsTitle}>
                {scorePercentage >= 70
                  ? t('results.greatJob')
                  : t('results.goodEffort')}
              </Text>
              <Text style={styles.resultsSubtitle}>
                {t('section.answeredCorrectly', {
                  correct: correctAnswersCount,
                  total: allQuestionsCount,
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.82}
              onPress={handleCompleteSection}
            >
              <Text style={[styles.primaryButtonText, { color: '#FDFEFF' }]}>
                {t('common.continue')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={isExitModalVisible}
        onRequestClose={() => setIsExitModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('section.exitActivity')}</Text>
              <TouchableOpacity
                activeOpacity={0.72}
                onPress={() => setIsExitModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#28363E" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalMessage}>
              {t('section.exitActivityMessage')}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.74}
                onPress={() => setIsExitModalVisible(false)}
              >
                <Text style={styles.modalCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  { backgroundColor: colors.primary },
                ]}
                activeOpacity={0.82}
                onPress={() => {
                  setIsExitModalVisible(false)
                  router.replace(
                    `/(tabs)/courses/${courseId}/section/${sectionId}`
                  )
                }}
              >
                <Text style={styles.modalConfirmText}>
                  {t('section.confirmExit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  mediaBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: -6,
    height: 426,
    backgroundColor: '#35A1B1',
    borderBottomRightRadius: 82,
  },
  progressShell: {
    paddingHorizontal: 32,
  },
  stageContainer: {
    flex: 1,
    paddingTop: 24,
  },
  videoContent: {
    paddingHorizontal: 32,
  },
  questionStageContent: {
    paddingHorizontal: 32,
  },
  questionBlock: {
    marginTop: 24,
  },
  videoFooter: {
    alignItems: 'center',
    marginTop: 24,
    width: '100%',
  },
  primaryButton: {
    width: '100%',
    minHeight: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center',
  },
  helperText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 18,
    color: '#4E6879',
    textAlign: 'center',
    width: '100%',
  },
  exitText: {
    marginTop: 28,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#D62B25',
    textDecorationLine: 'underline',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  resultsCard: {
    alignItems: 'center',
    backgroundColor: '#FDFEFF',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 32,
    marginBottom: 24,
    shadowColor: '#28363E',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  resultsIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#28363E',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultsSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#4E6879',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 27, 31, 0.28)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: '#FDFEFF',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#28363E',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4E6879',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCancel: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#28363E',
  },
  modalConfirm: {
    minWidth: 92,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalConfirmText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    color: '#FDFEFF',
  },
})
