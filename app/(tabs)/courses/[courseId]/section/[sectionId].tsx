import ButtonPrimary from '@/components/Common/ButtonPrimary'
import QuestionCard from '@/components/Section/QuestionCard'
import SectionProgressBar from '@/components/Section/SectionProgressBar'
import TextReadingCard from '@/components/Section/TextReadingCard'
import TrueFalseCard from '@/components/Section/TrueFalseCard'
import VideoPlayerWithPauses from '@/components/Section/VideoPlayerWithPauses'
import { AppColors } from '@/constants/theme/AppColors'
import { Activity, ActivityType, Section } from '@/data/mock-data'
import { useCourse } from '@/hooks/api/useCourse'
import { t } from '@/i18n/config'
import {
  hasPassedCourse,
  isCourseCompleted,
  markCourseCompleted,
  saveSectionProgress,
} from '@/utils/progress-storage'
import { syncProgressToBackend } from '@/utils/progress-sync'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Phase = 'activities' | 'results'

interface ActivityAnswer {
  activityId: string
  isCorrect: boolean
  answer: number | boolean
}

export default function SectionScreen() {
  const { courseId, sectionId } = useLocalSearchParams<{
    courseId: string
    sectionId: string
  }>()
  const router = useRouter()
  const colors = AppColors()
  const insets = useSafeAreaInsets()

  // Fetch course from API
  const { data: course, isLoading, error } = useCourse(courseId)

  // Get section from course
  const section = useMemo(() => {
    return course?.sections.find((s) => s.id === sectionId)
  }, [course, sectionId])

  // Get next section
  const getNextSection = (): Section | null => {
    if (!course) return null
    const currentIndex = course.sections.findIndex((s) => s.id === sectionId)
    if (currentIndex === -1 || currentIndex === course.sections.length - 1) {
      return null
    }
    return course.sections[currentIndex + 1]
  }

  const [phase, setPhase] = useState<Phase>('activities')
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [activityAnswers, setActivityAnswers] = useState<ActivityAnswer[]>([])
  const [showExitModal, setShowExitModal] = useState(false)
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [hasAnsweredCurrentPause, setHasAnsweredCurrentPause] = useState(false)
  const [isVideoComplete, setIsVideoComplete] = useState(false)

  // Get activities from section (support both legacy questions and new activities)
  const activities: Activity[] = useMemo(() => {
    if (section?.activities && section.activities.length > 0) {
      return section.activities
    }

    // Convert legacy questions to activities format
    if (section?.questions && section.questions.length > 0) {
      return section.questions.map((q) => ({
        id: q.id,
        type: (q.type === 'true_false'
          ? 'true_false'
          : 'multiple_choice') as ActivityType,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        icon: q.icon,
      }))
    }

    return []
  }, [section])

  // Reset all state when sectionId changes
  useEffect(() => {
    setPhase('activities')
    setCurrentActivityIndex(0)
    setActivityAnswers([])
    setIsVideoPaused(false)
    setHasAnsweredCurrentPause(false)
    setIsVideoComplete(false)
  }, [sectionId])

  // Show loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <ActivityIndicator size="large" color="#4A90A4" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('section.loading') || 'Loading section...'}
        </Text>
      </View>
    )
  }

  // Show error state
  if (error || !course || !section || activities.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.backgroundTeal,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Text style={{ color: colors.textLight }}>
          {t('errors.loadSection')}
        </Text>
      </View>
    )
  }

  const currentActivity = activities[currentActivityIndex]
  const isLastActivity = currentActivityIndex === activities.length - 1

  // Get all video pause timestamps for video-based sections
  const videoPauseActivities = activities.filter(
    (a) => a.type === 'video_pause'
  )
  const pauseTimestamps = videoPauseActivities.map((a) => a.pauseTimestamp || 0)

  const handleVideoPauseReached = (timestamp: number) => {
    setIsVideoPaused(true)
    setHasAnsweredCurrentPause(false)

    // Find the activity index for this pause
    const activityIndex = activities.findIndex(
      (a) => a.type === 'video_pause' && a.pauseTimestamp === timestamp
    )
    if (activityIndex !== -1) {
      setCurrentActivityIndex(activityIndex)
    }
  }

  const handleVideoComplete = () => {
    setIsVideoComplete(true)
  }

  const handleContinueAfterVideo = () => {
    // Check if there are more activities after video pauses
    const lastVideoPauseIndex = activities
      .map((a, i) => (a.type === 'video_pause' ? i : -1))
      .filter((i) => i !== -1)
      .pop()

    if (
      lastVideoPauseIndex !== undefined &&
      lastVideoPauseIndex < activities.length - 1
    ) {
      // Move to next activity after video
      setCurrentActivityIndex(lastVideoPauseIndex + 1)
      setIsVideoComplete(false)
    } else {
      // No more activities, show results
      setPhase('results')
    }
  }

  const handleActivityAnswer = (
    isCorrect: boolean,
    answer: number | boolean
  ) => {
    if (!currentActivity) return

    const newAnswer: ActivityAnswer = {
      activityId: currentActivity.id,
      isCorrect,
      answer,
    }
    setActivityAnswers([...activityAnswers, newAnswer])
    setHasAnsweredCurrentPause(true)

    // Move to next activity or show results
    setTimeout(() => {
      if (isLastActivity) {
        setPhase('results')
      } else {
        // If this was a video pause, resume video
        if (currentActivity.type === 'video_pause') {
          setIsVideoPaused(false)
        }
        setCurrentActivityIndex(currentActivityIndex + 1)
      }
    }, 1500)
  }

  const handleTextReadingComplete = () => {
    if (!currentActivity) return

    // Text reading doesn't have a correct/incorrect answer
    const newAnswer: ActivityAnswer = {
      activityId: currentActivity.id,
      isCorrect: true,
      answer: true,
    }
    setActivityAnswers([...activityAnswers, newAnswer])

    // Move to next activity or show results
    if (isLastActivity) {
      setPhase('results')
    } else {
      setCurrentActivityIndex(currentActivityIndex + 1)
    }
  }

  const handleExitSection = () => {
    setShowExitModal(true)
  }

  const confirmExit = () => {
    setShowExitModal(false)
    router.replace(`/(tabs)/courses/${courseId}`)
  }

  const handleReplaySection = () => {
    setPhase('activities')
    setCurrentActivityIndex(0)
    setActivityAnswers([])
    setIsVideoPaused(false)
    setHasAnsweredCurrentPause(false)
    setIsVideoComplete(false)
  }

  const handleCompleteSection = async () => {
    const correctAnswers = activityAnswers.filter((a) => a.isCorrect).length
    const totalActivities = activities.length

    // Save progress locally
    await saveSectionProgress(
      courseId,
      sectionId,
      correctAnswers,
      totalActivities
    )

    // Check if all sections are completed
    const nextSection = getNextSection()
    const courseCompleted = await isCourseCompleted(
      courseId,
      course.sections.length
    )

    if (courseCompleted) {
      const passed = await hasPassedCourse(
        courseId,
        course.sections.length,
        course.passingThreshold
      )

      await markCourseCompleted(courseId)

      // Sync to backend (don't await to not block navigation)
      syncProgressToBackend(courseId).catch((err) =>
        console.error('Background sync failed:', err)
      )

      if (passed) {
        router.replace(`/(tabs)/courses/${courseId}/certificate`)
      } else {
        router.replace(`/(tabs)/courses/${courseId}`)
      }
    } else {
      // Sync to backend (don't await to not block navigation)
      syncProgressToBackend(courseId).catch((err) =>
        console.error('Background sync failed:', err)
      )

      if (nextSection) {
        router.replace(`/(tabs)/courses/${courseId}/section/${nextSection.id}`)
      } else {
        router.replace(`/(tabs)/courses/${courseId}`)
      }
    }
  }

  const correctAnswersCount = activityAnswers.filter((a) => a.isCorrect).length
  const scorePercentage = Math.round(
    (correctAnswersCount / activities.length) * 100
  )

  const renderActivity = () => {
    if (!currentActivity) return null

    switch (currentActivity.type) {
      case 'video_pause':
        // Show video player for video activities, with question below when paused
        return (
          <ScrollView
            style={styles.videoActivityContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.videoActivityContent}
          >
            {section.videoUrl && (
              <View style={styles.videoContainer}>
                <VideoPlayerWithPauses
                  videoUrl={section.videoUrl}
                  pauseTimestamps={pauseTimestamps}
                  onPauseReached={handleVideoPauseReached}
                  isPaused={isVideoPaused}
                  onResume={() => {
                    setIsVideoPaused(false)
                    setHasAnsweredCurrentPause(false)
                  }}
                  onVideoComplete={handleVideoComplete}
                />
              </View>
            )}

            {/* Show continue button when video is complete */}
            {isVideoComplete && (
              <View style={styles.continueContainer}>
                <ButtonPrimary
                  title={t('common.continue')}
                  onPress={handleContinueAfterVideo}
                  icon="arrow-forward"
                  fullWidth
                />
              </View>
            )}

            {/* Show question when video is paused */}
            {isVideoPaused && !hasAnsweredCurrentPause && (
              <View style={styles.questionBelowVideo}>
                {currentActivity.correctAnswer === true ||
                currentActivity.correctAnswer === false ? (
                  <TrueFalseCard
                    question={currentActivity.question || ''}
                    onAnswer={handleActivityAnswer}
                    correctAnswer={currentActivity.correctAnswer}
                    currentActivity={currentActivityIndex + 1}
                    totalActivities={activities.length}
                  />
                ) : (
                  <QuestionCard
                    question={{
                      id: currentActivity.id,
                      type: 'multiple_choice',
                      question: currentActivity.question || '',
                      options: currentActivity.options || [],
                      correctAnswer: currentActivity.correctAnswer as number,
                      icon: currentActivity.icon,
                    }}
                    onAnswer={handleActivityAnswer}
                    currentQuestion={currentActivityIndex + 1}
                    totalQuestions={activities.length}
                  />
                )}
              </View>
            )}
          </ScrollView>
        )

      case 'true_false':
        return (
          <ScrollView
            style={styles.activityScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <TrueFalseCard
              question={currentActivity.question || ''}
              imageUrl={currentActivity.imageUrl}
              onAnswer={handleActivityAnswer}
              correctAnswer={currentActivity.correctAnswer as boolean}
              currentActivity={currentActivityIndex + 1}
              totalActivities={activities.length}
            />
          </ScrollView>
        )

      case 'text_reading':
        return (
          <TextReadingCard
            textPages={currentActivity.textPages || []}
            courseTitle={course.title}
            sectionTitle={section.title}
            onComplete={handleTextReadingComplete}
          />
        )

      case 'multiple_choice':
        return (
          <ScrollView
            style={styles.activityScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <QuestionCard
              question={{
                id: currentActivity.id,
                type: 'multiple_choice',
                question: currentActivity.question || '',
                options: currentActivity.options || [],
                correctAnswer: currentActivity.correctAnswer as number,
                icon: currentActivity.icon,
              }}
              onAnswer={handleActivityAnswer}
              currentQuestion={currentActivityIndex + 1}
              totalQuestions={activities.length}
              imageUrl={currentActivity.imageUrl}
            />
          </ScrollView>
        )

      default:
        return null
    }
  }

  return (
    <View
      key={sectionId}
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.backgroundPrimary,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleExitSection}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {phase === 'activities' && (
          <View style={styles.progressContainer}>
            <SectionProgressBar
              currentActivity={currentActivityIndex}
              totalActivities={activities.length}
            />
          </View>
        )}
      </View>

      {/* Content */}
      {phase === 'activities' && (
        <View style={styles.content}>
          {renderActivity()}

          {/* Exit Link at bottom */}
          {currentActivity.type !== 'text_reading' && (
            <TouchableOpacity
              style={styles.exitLink}
              onPress={handleExitSection}
            >
              <Text style={[styles.exitLinkText, { color: colors.textLight }]}>
                {t('section.exitActivity')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {phase === 'results' && (
        <>
          <ScrollView
            style={[
              styles.resultsContainer,
              { backgroundColor: colors.backgroundPrimary },
            ]}
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
              You answered {correctAnswersCount} out of {activities.length}{' '}
              correctly
            </Text>

            <View style={styles.resultsDetails}>
              {activities
                .filter((a) => a.type !== 'text_reading')
                .map((activity) => {
                  const answerIndex = activityAnswers.findIndex(
                    (a) => a.activityId === activity.id
                  )
                  const userAnswer =
                    answerIndex !== -1 ? activityAnswers[answerIndex] : null
                  const isCorrect = userAnswer?.isCorrect

                  return (
                    <View
                      key={activity.id}
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
                          Question {answerIndex + 1}
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
                        {activity.question}
                      </Text>
                    </View>
                  )
                })}
            </View>

            {/* Replay Button */}
            <TouchableOpacity
              style={[
                styles.replayButton,
                { backgroundColor: colors.backgroundPrimary },
              ]}
              onPress={handleReplaySection}
            >
              <Ionicons name="refresh" size={20} color={colors.primary} />
              <Text
                style={[styles.replayButtonText, { color: colors.primary }]}
              >
                {t('section.replaySection')}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.backgroundPrimary,
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

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('section.exitConfirmTitle')}
            </Text>
            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              {t('section.exitConfirmMessage')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setShowExitModal(false)}
              >
                <Text
                  style={[styles.modalButtonText, { color: colors.primary }]}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={confirmExit}
              >
                <Text
                  style={[styles.modalButtonText, { color: colors.textLight }]}
                >
                  {t('section.exitConfirm')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  videoActivityContainer: {
    flex: 1,
  },
  videoActivityContent: {
    paddingBottom: 100,
  },
  videoContainer: {
    padding: 16,
    paddingTop: 24,
  },
  continueContainer: {
    padding: 24,
  },
  questionBelowVideo: {
    paddingTop: 8,
  },
  activityScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  exitLink: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
  },
  exitLinkText: {
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  resultsContainer: {
    flex: 1,
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
    backgroundColor: '#F0F9FB',
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
    marginBottom: 24,
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
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  replayButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
})
