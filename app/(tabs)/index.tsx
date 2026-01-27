import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { Course, mockCourses } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { getEnrolledCourses } from '@/utils/enrollment-storage'
import { getCourseCompletionPercentage } from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export default function CoursesScreen() {
  const router = useRouter()
  const colors = AppColors()
  const { currentLanguage } = useLanguage()
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>(
    {}
  )
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])

  useEffect(() => {
    loadData()
  }, [])

  // Reload enrolled courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const loadData = async () => {
    // Load enrolled course IDs
    const enrolledIds = await getEnrolledCourses()

    // Filter courses to only show enrolled ones
    const enrolled = mockCourses.filter((course) =>
      enrolledIds.includes(course.id)
    )
    setEnrolledCourses(enrolled)

    // Load progress for enrolled courses
    const progress: Record<string, number> = {}
    for (const course of enrolled) {
      const percentage = await getCourseCompletionPercentage(
        course.id,
        course.sections.length
      )
      progress[course.id] = percentage
    }
    setCourseProgress(progress)
  }

  const handleCoursePress = (courseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(tabs)/courses/${courseId}`)
  }

  // Calculate total sections completed and total sections for enrolled courses
  const getTotalProgress = () => {
    let completedSections = 0
    let totalSections = 0
    enrolledCourses.forEach((course) => {
      totalSections += course.sections.length
      const progress = courseProgress[course.id] || 0
      completedSections += Math.round((progress / 100) * course.sections.length)
    })
    return { completedSections, totalSections }
  }

  const { completedSections, totalSections } = getTotalProgress()
  const levelProgress =
    totalSections > 0 ? (completedSections / totalSections) * 100 : 0
  const pointsToNextLevel = 10

  // Show message if no enrolled courses
  if (enrolledCourses.length === 0) {
    return (
      <View
        key={currentLanguage}
        style={[
          styles.container,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Image
                source={require('@/assets/images/logo_black240.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
                {t('home.welcome')}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons
              name="school-outline"
              size={80}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.emptyStateText, { color: colors.textPrimary }]}
            >
              {t('home.noCourses')}
            </Text>
            <Text
              style={[
                styles.emptyStateSubtext,
                { color: colors.textSecondary },
              ]}
            >
              {t('home.exploreToEnroll')}
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/(tabs)/explore')
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.exploreButtonText}>
                {t('home.exploreCourses')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Welcome */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Image
              source={require('@/assets/images/logo_black240.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>
              {t('home.welcome')}
            </Text>
          </View>
        </View>

        {/* Level Progress Card */}
        <View
          style={[styles.levelCard, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.levelTitle, { color: '#4A90A4' }]}>
            {t('home.level', { level: 1 })}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${levelProgress}%` }]}
              />
            </View>
          </View>
          <Text
            style={[styles.levelProgressText, { color: colors.textSecondary }]}
          >
            {t('home.levelProgress', { points: pointsToNextLevel })}
          </Text>
        </View>

        {/* Course Cards */}
        {enrolledCourses.map((course) => {
          const progress = courseProgress[course.id] || 0
          const completedCount = Math.round(
            (progress / 100) * course.sections.length
          )
          const totalCount = course.sections.length

          return (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => handleCoursePress(course.id)}
              activeOpacity={0.7}
            >
              <View style={styles.courseHeader}>
                <Ionicons
                  name="bar-chart"
                  size={28}
                  color={colors.textPrimary}
                />
                <Text
                  style={[styles.courseTitle, { color: colors.textPrimary }]}
                >
                  {course.title}
                </Text>
              </View>

              <View style={styles.courseDivider} />

              <View style={styles.courseMetadata}>
                <View style={styles.metadataRow}>
                  <Ionicons
                    name="school-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.metadataText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {course.shortDescription}
                  </Text>
                </View>

                <View style={styles.metadataRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.metadataText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {course.estimatedTime}
                  </Text>
                </View>
              </View>

              <View style={styles.courseProgressContainer}>
                <View style={styles.courseProgressBar}>
                  <View
                    style={[
                      styles.courseProgressFill,
                      { width: `${progress}%` },
                    ]}
                  />
                </View>
                <View style={styles.progressInfo}>
                  <Text
                    style={[
                      styles.progressCount,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {completedCount}/{totalCount}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 50,
    height: 50,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '700',
  },
  levelCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A90A4',
    borderRadius: 6,
  },
  levelProgressText: {
    fontSize: 15,
    lineHeight: 22,
  },
  courseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  courseDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  courseMetadata: {
    gap: 8,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 15,
  },
  courseProgressContainer: {
    gap: 8,
  },
  courseProgressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: '#4A90A4',
    borderRadius: 5,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  emptyStateCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#4A90A4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})
