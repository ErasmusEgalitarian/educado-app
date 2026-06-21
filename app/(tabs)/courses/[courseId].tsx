import SectionListItem from '@/components/Course/SectionListItem'
import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCourse } from '@/hooks/useCourses'
import {
  useDeleteDownload,
  useDownloadCourse,
  useIsDownloaded,
} from '@/hooks/useDownloads'
import { useDropEnrollment, useEnrollmentDetail } from '@/hooks/useProgress'
import { t } from '@/i18n/config'
import { clearCourseProgress } from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
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
  const { token } = useAuth()

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
  const dropEnrollmentMutation = useDropEnrollment()
  const isCourseDownloaded = downloadManifest?.status === 'complete'

  useFocusEffect(
    useCallback(() => {
      refetchCourse()
      refetchProgress()
    }, [refetchCourse, refetchProgress])
  )

  const {
    completedSections,
    sectionScores,
    completionPercentage,
    pointsEarned,
  } = useMemo(() => {
    const completed = new Set<string>()
    const scores = new Map<string, { score: number; totalQuestions: number }>()

    const points =
      enrollmentDetail?.sections.reduce(
        (sum, section) => sum + (section.score ?? 0),
        0
      ) || 0

    if (enrollmentDetail?.sections) {
      for (const section of enrollmentDetail.sections) {
        if (section.status === 'completed') {
          completed.add(section.id)
        }

        if (section.score !== null && section.totalQuestions !== null) {
          scores.set(section.id, {
            score: section.score,
            totalQuestions: section.totalQuestions,
          })
        }
      }
    }

    const totalSections = course?.sections.length || 0
    const percentage =
      totalSections > 0 ? Math.round((completed.size / totalSections) * 100) : 0

    return {
      completedSections: completed,
      sectionScores: scores,
      completionPercentage: percentage,
      pointsEarned: points,
    }
  }, [course, enrollmentDetail])

  const handleStartCourse = () => {
    if (!course) return

    const firstIncomplete = course.sections.find(
      (section) => !completedSections.has(section.id)
    )
    const targetSection = firstIncomplete || course.sections[0]

    if (targetSection) {
      router.push(`/(tabs)/courses/${courseId}/section/${targetSection.id}`)
    }
  }

  const handleSectionPress = (sectionId: string, sectionIndex: number) => {
    if (!course) return

    if (sectionIndex > 0) {
      const previousSectionId = course.sections[sectionIndex - 1].id
      if (!completedSections.has(previousSectionId)) {
        return
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
        { text: t('course.cancel'), style: 'cancel' },
        {
          text: t('course.unenrollConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await dropEnrollmentMutation.mutateAsync(courseId)
              await clearCourseProgress(courseId)
              router.back()
            } catch {
              Alert.alert(t('errors.generic'), t('course.unenrollError'))
            }
          },
        },
      ]
    )
  }

  if (courseLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.backgroundPrimary }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!course) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.backgroundPrimary }]}
      >
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>
          {t('errors.loadCourse')}
        </Text>
      </View>
    )
  }

  const isStarted = completedSections.size > 0
  const courseImageSource = course.imageUrl.startsWith('http')
    ? {
        uri: course.imageUrl,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    : require('@/assets/images/logo_black240.png')

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 72 },
        ]}
      >
        <View style={styles.heroContainer}>
          <Image
            source={courseImageSource}
            style={styles.heroImage}
            contentFit="cover"
            contentPosition="center"
          />
          <View style={[styles.heroTitleRow, { top: insets.top + 16 }]}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.78}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={22} color="#28363E" />
            </TouchableOpacity>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {course.title}
            </Text>
          </View>
        </View>

        <View style={styles.courseCard}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseName}>{course.title}</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                if (isCourseDownloaded) {
                  Alert.alert(t('downloads.downloadComplete'), course.title, [
                    { text: t('common.ok'), style: 'cancel' },
                    {
                      text: t('downloads.deleteDownload'),
                      style: 'destructive',
                      onPress: () => deleteMutation.mutate(courseId),
                    },
                  ])
                  return
                }

                if (!downloadMutation.isPending) {
                  Alert.alert(t('downloads.downloadCourse'), course.title, [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('common.ok'),
                      onPress: () => downloadMutation.mutate(courseId),
                    },
                  ])
                }
              }}
            >
              {downloadMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={isCourseDownloaded ? 'download' : 'download-outline'}
                  size={26}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(completionPercentage, 8)}%` },
              ]}
            />
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="star" size={14} color="#F4C542" />
              <Text style={styles.metricText}>
                {t('course.pointsLabel', { points: pointsEarned })}
              </Text>
            </View>

            <View style={styles.metricItem}>
              <Ionicons name="flash" size={14} color="#F4C542" />
              <Text style={styles.metricText}>
                {t('course.percentCompleted', {
                  percent: completionPercentage,
                })}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryAction, { backgroundColor: colors.primary }]}
          activeOpacity={0.86}
          onPress={handleStartCourse}
        >
          <Text style={styles.primaryActionText}>
            {isStarted ? t('course.continueLearning') : t('course.startCourse')}
          </Text>
          <Ionicons name="play-circle-outline" size={20} color="#FDFEFF" />
        </TouchableOpacity>

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

        <TouchableOpacity
          style={styles.unenrollButton}
          activeOpacity={0.72}
          onPress={handleUnenroll}
        >
          <Text style={styles.unenrollText}>{t('course.unenrollCourse')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    paddingBottom: 24,
  },
  heroContainer: {
    height: 208,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F7F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitleRow: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '500',
    color: '#383838',
  },
  courseCard: {
    backgroundColor: '#FDFEFF',
    borderRadius: 16,
    marginHorizontal: 48,
    marginTop: -58,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#28363E',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  courseName: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400',
    color: '#141B1F',
  },
  downloadButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#D9E4E8',
    marginVertical: 10,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D8EFF3',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#35A1B1',
    borderRadius: 999,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    color: '#383838',
  },
  primaryAction: {
    height: 54,
    borderRadius: 12,
    marginHorizontal: 25,
    marginTop: 22,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionText: {
    color: '#FDFEFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  sectionsContainer: {
    paddingHorizontal: 25,
    paddingTop: 4,
  },
  unenrollButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  unenrollText: {
    color: '#D62B25',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
})
