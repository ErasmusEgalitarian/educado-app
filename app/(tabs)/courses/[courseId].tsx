import ButtonPrimary from '@/components/Common/ButtonPrimary'
import ProgressBar from '@/components/Common/ProgressBar'
import SectionListItem from '@/components/Course/SectionListItem'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCourseById } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { getCourseImage } from '@/utils/image-loader'
import {
  getCourseProgress,
  getCourseScorePercentage,
  getFirstIncompleteSectionId,
  hasPassedCourse,
  isSectionCompleted,
} from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentLanguage } = useLanguage()

  const course = getCourseById(courseId)
  const [completedSections, setCompletedSections] = useState<Set<string>>(
    new Set()
  )
  const [hasPassed, setHasPassed] = useState(false)
  const [courseScore, setCourseScore] = useState(0)
  const [sectionScores, setSectionScores] = useState<
    Map<string, { score: number; totalQuestions: number }>
  >(new Map())

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

    // Check if user has passed
    if (completed.size === course.sections.length) {
      const passed = await hasPassedCourse(
        courseId,
        course.sections.length,
        course.passingThreshold
      )
      const score = await getCourseScorePercentage(courseId)
      setHasPassed(passed)
      setCourseScore(score)
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

  if (!course) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <Text style={{ color: colors.textPrimary }}>
          {t('errors.loadCourse')}
        </Text>
      </View>
    )
  }

  const isStarted = completedSections.size > 0
  const isCompleted = completedSections.size === course.sections.length

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroImageContainer}>
          <Image
            source={getCourseImage(course.imageUrl)}
            style={styles.heroImage}
            contentFit="cover"
          />
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.content,
            { backgroundColor: colors.backgroundPrimary },
          ]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {course.title}
          </Text>

          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons
                name="book-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.metadataText, { color: colors.textSecondary }]}
              >
                {course.sections.length} {t('common.sections')}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.metadataText, { color: colors.textSecondary }]}
              >
                {course.estimatedTime}
              </Text>
            </View>

            <View style={styles.metadataItem}>
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text
                style={[styles.metadataText, { color: colors.textSecondary }]}
              >
                {course.difficulty}
              </Text>
            </View>
          </View>

          {isStarted && (
            <View style={styles.progressSection}>
              <Text
                style={[styles.progressTitle, { color: colors.textPrimary }]}
              >
                Your Progress
              </Text>
              <ProgressBar
                current={completedSections.size}
                total={course.sections.length}
              />
            </View>
          )}

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {course.description}
          </Text>

          <View style={styles.sectionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Course Sections
            </Text>
          </View>

          {course.sections.map((section, index) => {
            const sectionScore = sectionScores.get(section.id)
            return (
              <SectionListItem
                key={section.id}
                section={section}
                sectionNumber={index + 1}
                isCompleted={completedSections.has(section.id)}
                isLocked={isSectionLocked(index)}
                onPress={() => handleSectionPress(section.id, index)}
                score={sectionScore?.score}
                totalQuestions={sectionScore?.totalQuestions}
              />
            )
          })}

          {/* Show score message if completed */}
          {isCompleted && (
            <View
              style={[
                styles.scoreMessage,
                {
                  backgroundColor: hasPassed ? colors.success : colors.warning,
                },
              ]}
            >
              <Ionicons
                name={hasPassed ? 'trophy' : 'information-circle'}
                size={24}
                color={colors.textLight}
              />
              <View style={styles.scoreMessageContent}>
                <Text
                  style={[
                    styles.scoreMessageTitle,
                    { color: colors.textLight },
                  ]}
                >
                  {hasPassed
                    ? 'Congratulations! You passed!'
                    : 'Course completed'}
                </Text>
                <Text
                  style={[styles.scoreMessageText, { color: colors.textLight }]}
                >
                  Your score: {courseScore}% (Passing: {course.passingThreshold}
                  %)
                </Text>
                {!hasPassed && (
                  <Text
                    style={[
                      styles.scoreMessageText,
                      { color: colors.textLight },
                    ]}
                  >
                    Retake sections to improve your score and earn a
                    certificate.
                  </Text>
                )}
              </View>
            </View>
          )}
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
          title={
            isCompleted && hasPassed
              ? t('course.viewCertificate')
              : isStarted
                ? t('course.continueLearning')
                : t('course.startCourse')
          }
          onPress={
            isCompleted && hasPassed
              ? () => router.push(`/(tabs)/courses/${courseId}/certificate`)
              : handleStartCourse
          }
          icon={isCompleted && hasPassed ? 'ribbon' : 'play'}
          fullWidth
          variant="primary"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    top: 50,
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
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    paddingBottom: 140,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  sectionsHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scoreMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 12,
  },
  scoreMessageContent: {
    flex: 1,
  },
  scoreMessageTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreMessageText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
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
})
