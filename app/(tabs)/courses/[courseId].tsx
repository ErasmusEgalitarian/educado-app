import SectionListItem from '@/components/Course/SectionListItem'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCourse } from '@/hooks/api/useCourse'
import { t } from '@/i18n/config'
import { unenrollFromCourse } from '@/utils/enrollment-storage'
import { getCourseImage } from '@/utils/image-loader'
import {
  getCourseCompletionPercentage,
  getCourseProgress,
  getCourseScorePercentage,
  getFirstIncompleteSectionId,
  isCourseCompleted,
  isSectionCompleted,
} from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function CourseDetailScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>()
  const router = useRouter()
  const colors = AppColors()
  const insets = useSafeAreaInsets()
  const { currentLanguage } = useLanguage()

  // Fetch course from API
  const { data: course, isLoading, error } = useCourse(courseId)
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set()
  )
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [sectionScores, setSectionScores] = useState<
    Map<string, { score: number; totalQuestions: number }>
  >(new Map())
  const [courseCompleted, setCourseCompleted] = useState(false)
  const [courseScorePercentage, setCourseScorePercentage] = useState(0)

  const loadProgress = useCallback(async () => {
    if (!course) return

    const courseProgress = await getCourseProgress(courseId)
    const completed = new Set(
      courseProgress.sections.filter((s) => s.completed).map((s) => s.sectionId)
    )
    setCompletedSections(completed)

    // Build section scores map
    const scores = new Map<string, { score: number; totalQuestions: number }>()
    courseProgress.sections.forEach((section) => {
      if (section.completed) {
        scores.set(section.sectionId, {
          score: section.score,
          totalQuestions: section.totalQuestions,
        })
      }
    })
    setSectionScores(scores)

    // Get completion percentage
    const percentage = await getCourseCompletionPercentage(
      courseId,
      course.sections.length
    )
    setCompletionPercentage(percentage)

    // Check if course is completed
    const isCompleted = await isCourseCompleted(
      courseId,
      course.sections.length
    )
    setCourseCompleted(isCompleted)

    // Get overall course score if completed
    if (isCompleted) {
      const overallScore = await getCourseScorePercentage(courseId)
      setCourseScorePercentage(overallScore)
    }
  }, [course, courseId])

  // Load progress on initial mount
  useEffect(() => {
    if (course) {
      loadProgress()
    }
  }, [course, loadProgress])

  // Reload progress when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      if (course) {
        loadProgress()
      }
    }, [course, loadProgress])
  )

  const handleStartCourse = async () => {
    if (!course) return

    const firstIncompleteId = await getFirstIncompleteSectionId(
      courseId,
      course.sections.map((s) => s.id)
    )

    router.push(`/(tabs)/courses/${courseId}/section/${firstIncompleteId}`)
  }

  const handleSectionPress = async (
    sectionId: string,
    sectionIndex: number
  ) => {
    if (!course) return

    // Check if previous sections are completed (unless it's the first section)
    if (sectionIndex > 0) {
      const previousSectionId = course.sections[sectionIndex - 1].id
      const isPreviousCompleted = await isSectionCompleted(
        courseId,
        previousSectionId
      )

      if (!isPreviousCompleted) {
        // Section is locked
        return
      }
    }

    router.push(`/(tabs)/courses/${courseId}/section/${sectionId}`)
  }

  const isSectionLocked = (sectionIndex: number): boolean => {
    if (sectionIndex === 0) return false

    const previousSectionId = course?.sections[sectionIndex - 1].id
    return previousSectionId ? !completedSections.has(previousSectionId) : false
  }

  const handleUnenroll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      t('course.unenrollConfirmTitle'),
      t('course.unenrollConfirmMessage'),
      [
        {
          text: t('course.cancel'),
          style: 'cancel',
        },
        {
          text: t('course.unenrollConfirm'),
          style: 'destructive',
          onPress: async () => {
            await unenrollFromCourse(courseId)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            router.back()
          },
        },
      ]
    )
  }

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
          {t('course.loading') || 'Loading course...'}
        </Text>
      </View>
    )
  }

  // Show error state
  if (error || !course) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {t('errors.loadCourse') || 'Failed to load course'}
        </Text>
        <TouchableOpacity
          style={styles.backToCoursesButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backToCoursesText}>
            {t('course.back') || 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  const isStarted = completedSections.size > 0

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image with Back Button */}
        <View style={styles.heroImageContainer}>
          <Image
            source={getCourseImage(course.imageUrl)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.cardBackground,
                top: insets.top + 16,
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Course Card */}
        <View
          style={[
            styles.courseCard,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          {/* Course Title */}
          <View style={styles.courseTitleRow}>
            <Text style={[styles.courseTitle, { color: colors.textPrimary }]}>
              {course.title}
            </Text>
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons
                name="download-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
          </View>

          {/* Completion Percentage */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={16} color="#FCD34D" />
              <Text style={[styles.statText, { color: colors.textPrimary }]}>
                {t('course.percentCompleted', {
                  percent: completionPercentage,
                })}
              </Text>
            </View>
          </View>
        </View>

        {/* Show message if completed but didn't pass */}
        {courseCompleted && courseScorePercentage < course.passingThreshold && (
          <View
            style={[
              styles.notPassedBanner,
              {
                backgroundColor: colors.warning + '15',
                borderColor: colors.warning,
              },
            ]}
          >
            <Ionicons name="alert-circle" size={24} color={colors.warning} />
            <View style={styles.notPassedTextContainer}>
              <Text
                style={[styles.notPassedTitle, { color: colors.textPrimary }]}
              >
                {t('course.courseCompleted')}
              </Text>
              <Text
                style={[
                  styles.notPassedMessage,
                  { color: colors.textSecondary },
                ]}
              >
                {t('course.yourScore', {
                  score: courseScorePercentage,
                  passing: course.passingThreshold,
                })}
              </Text>
              <Text
                style={[styles.notPassedHint, { color: colors.textSecondary }]}
              >
                {t('course.retakeMessage')}
              </Text>
            </View>
          </View>
        )}

        {/* Start/Continue Button */}
        {!courseCompleted && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={handleStartCourse}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>
              {isStarted
                ? t('course.continueLearning')
                : t('course.startCourse')}
            </Text>
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* View Certificate Button (if passed) */}
        {courseCompleted &&
          courseScorePercentage >= course.passingThreshold && (
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: colors.success }]}
              onPress={() =>
                router.push(`/(tabs)/courses/${courseId}/certificate`)
              }
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>
                {t('course.viewCertificate')}
              </Text>
              <Ionicons name="ribbon" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

        {/* Sections List */}
        <View style={styles.sectionsContainer}>
          {course.sections.map((section, index) => {
            const sectionScore = sectionScores.get(section.id)
            return (
              <SectionListItem
                key={section.id}
                section={section}
                isCompleted={completedSections.has(section.id)}
                isLocked={isSectionLocked(index)}
                onPress={() => handleSectionPress(section.id, index)}
                score={sectionScore?.score}
                totalQuestions={sectionScore?.totalQuestions}
              />
            )
          })}
        </View>

        {/* Unenroll Button */}
        <View style={styles.unenrollContainer}>
          <TouchableOpacity
            style={styles.unenrollButton}
            onPress={handleUnenroll}
            activeOpacity={0.7}
          >
            <Text style={styles.unenrollText}>
              {t('course.unenrollCourse')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroImageContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  courseCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: -30,
    marginBottom: 24,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  courseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  downloadButton: {
    padding: 4,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90A4',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    marginHorizontal: 24,
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  notPassedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  notPassedTextContainer: {
    flex: 1,
  },
  notPassedTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  notPassedMessage: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  notPassedHint: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sectionsContainer: {
    paddingHorizontal: 24,
  },
  unenrollContainer: {
    paddingHorizontal: 24,
  },
  unenrollButton: {
    marginTop: 32,
    paddingVertical: 12,
    alignItems: 'center',
  },
  unenrollText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  backToCoursesButton: {
    backgroundColor: '#4A90A4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  backToCoursesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
