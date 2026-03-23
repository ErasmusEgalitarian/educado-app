import SectionListItem from '@/components/Course/SectionListItem'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCourse } from '@/hooks/useCourses'
import { useDownloadCourse, useIsDownloaded, useDeleteDownload } from '@/hooks/useDownloads'
import { useEnrollmentDetail } from '@/hooks/useProgress'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
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

  const {
    data: course,
    isLoading: courseLoading,
    refetch: refetchCourse,
  } = useCourse(courseId)
  const { data: enrollmentDetail, refetch: refetchProgress } =
    useEnrollmentDetail(courseId)
  const { data: downloadManifest } = useIsDownloaded(courseId)
  const downloadMutation = useDownloadCourse()
  const deleteMutation = useDeleteDownload()
  const isCourseDownloaded = downloadManifest?.status === 'complete'
  const progress = enrollmentDetail
    ? {
        sectionProgresses: enrollmentDetail.sections.map((s) => ({
          sectionId: s.id,
          completedAt: s.status === 'completed' ? new Date().toISOString() : null,
          id: s.id,
          courseProgressId: '',
        })),
      }
    : undefined

  // Reload progress when screen comes back into focus
  useFocusEffect(
    useCallback(() => {
      refetchCourse()
      refetchProgress()
    }, [refetchCourse, refetchProgress])
  )

  // Compute completion state from API progress
  const { completedSections, sectionScores, completionPercentage } =
    useMemo(() => {
      const completed = new Set<string>()
      const scores = new Map<
        string,
        { score: number; totalQuestions: number }
      >()

      if (progress?.sectionProgresses) {
        for (const sp of progress.sectionProgresses) {
          if (sp.completedAt) {
            completed.add(sp.sectionId)
          }
        }
      }

      // Calculate score from local storage if available (API doesn't store scores)
      // For now, completed sections show as completed without score detail
      const totalSections = course?.sections.length || 0
      const percentage =
        totalSections > 0
          ? Math.round((completed.size / totalSections) * 100)
          : 0

      return {
        completedSections: completed,
        sectionScores: scores,
        completionPercentage: percentage,
      }
    }, [progress, course])

  const handleStartCourse = () => {
    if (!course) return

    // Find first incomplete section
    const firstIncomplete = course.sections.find(
      (s) => !completedSections.has(s.id)
    )
    const targetSection = firstIncomplete || course.sections[0]
    if (targetSection) {
      router.push(`/(tabs)/courses/${courseId}/section/${targetSection.id}`)
    }
  }

  const handleSectionPress = (sectionId: string, sectionIndex: number) => {
    if (!course) return

    // Check if previous sections are completed (unless it's the first section)
    if (sectionIndex > 0) {
      const previousSectionId = course.sections[sectionIndex - 1].id
      if (!completedSections.has(previousSectionId)) {
        return // Section is locked
      }
    }

    router.push(`/(tabs)/courses/${courseId}/section/${sectionId}`)
  }

  const isSectionLocked = (sectionIndex: number): boolean => {
    if (sectionIndex === 0) return false
    const previousSectionId = course?.sections[sectionIndex - 1]?.id
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
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            router.back()
          },
        },
      ]
    )
  }

  if (courseLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
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

  // Course image: use API URL if it starts with http, otherwise use local image loader
  const courseImageSource = course.imageUrl.startsWith('http')
    ? { uri: course.imageUrl }
    : require('@/assets/images/logo_black240.png')

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
            source={courseImageSource}
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
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                if (isCourseDownloaded) {
                  Alert.alert(
                    t('downloads.downloadComplete'),
                    course.title,
                    [
                      { text: t('common.ok'), style: 'cancel' },
                      {
                        text: t('downloads.deleteDownload'),
                        style: 'destructive',
                        onPress: () => deleteMutation.mutate(courseId),
                      },
                    ]
                  )
                } else if (!downloadMutation.isPending) {
                  Alert.alert(
                    t('downloads.downloadCourse'),
                    course.title,
                    [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.ok'),
                        onPress: () => downloadMutation.mutate(courseId),
                      },
                    ]
                  )
                }
              }}
            >
              {downloadMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={isCourseDownloaded ? 'checkmark-circle' : 'download-outline'}
                  size={24}
                  color={isCourseDownloaded ? '#22C55E' : colors.primary}
                />
              )}
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

        {/* Start/Continue Button */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.primary }]}
          onPress={handleStartCourse}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>
            {isStarted ? t('course.continueLearning') : t('course.startCourse')}
          </Text>
          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>

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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
})
