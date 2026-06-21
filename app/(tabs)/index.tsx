import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGamificationSummary } from '@/hooks/useGamification'
import { useEnrollments } from '@/hooks/useProgress'
import { t } from '@/i18n/config'
import { ApiEnrollment } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
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

  const {
    data: enrollments = [],
    isLoading,
    error: enrollmentsError,
    refetch: refetchEnrollments,
  } = useEnrollments()

  const { data: gamification, refetch: refetchGamification } =
    useGamificationSummary()

  const [refreshing, setRefreshing] = useState(false)

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchEnrollments()
      refetchGamification()
    }, [refetchEnrollments, refetchGamification])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([refetchEnrollments(), refetchGamification()])
    setRefreshing(false)
  }, [refetchEnrollments, refetchGamification])

  // Filter active enrollments that have course data
  const activeEnrollments = useMemo(() => {
    return enrollments.filter(
      (e) => (e.status === 'ACTIVE' || e.status === 'COMPLETED') && e.course
    )
  }, [enrollments])

  const handleCoursePress = (courseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/(tabs)/courses/${courseId}`)
  }

  const currentLevel = gamification?.currentLevel ?? 1
  const xpProgress = gamification?.xpProgress ?? 0
  const xpNeeded = gamification?.xpNeeded ?? 1
  const xpPercent =
    xpNeeded > 0 ? Math.min((xpProgress / xpNeeded) * 100, 100) : 0

  if (isLoading) {
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

  // Offline state
  if (enrollmentsError) {
    return (
      <View
        key={currentLanguage}
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={80}
          color={colors.textSecondary}
        />
        <Text style={[styles.emptyTitle, { marginTop: 16 }]}>
          {t('offline.title')}
        </Text>
        <Text style={[styles.emptyMessage, { marginBottom: 0 }]}>
          {t('offline.message')}
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, { marginTop: 24 }]}
          onPress={() => router.push('/(tabs)/downloads')}
          activeOpacity={0.82}
        >
          <Text style={styles.exploreButtonText}>
            {t('offline.goToDownloads')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 16 }}
          onPress={() => refetchEnrollments()}
          activeOpacity={0.7}
        >
          <Text
            style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}
          >
            {t('offline.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Empty state — not enrolled in any course
  if (activeEnrollments.length === 0) {
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
          contentContainerStyle={styles.emptyScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Image
            source={require('@/assets/images/logo-educado-wordmark.png')}
            style={styles.wordmark}
            contentFit="contain"
          />

          <View style={styles.emptyContent}>
            <Image
              source={require('@/assets/images/home-empty-illustration.png')}
              style={styles.illustration}
              contentFit="contain"
            />
            <Text style={styles.emptyTitle}>{t('home.noCourses')}</Text>
            <Text style={styles.emptyMessage}>{t('home.exploreToEnroll')}</Text>

            <TouchableOpacity
              style={[
                styles.exploreButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                router.push('/(tabs)/explore')
              }}
              activeOpacity={0.82}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header — logo mark + welcome */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logo_black240.png')}
            style={styles.logoMark}
            contentFit="contain"
          />
          <Text style={styles.welcomeText}>{t('home.welcome')}</Text>
        </View>

        {/* Level progress card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <Text style={styles.levelTitle}>
              {t('home.level', { level: currentLevel })}
            </Text>
            <View style={styles.levelBarTrack}>
              <View style={[styles.levelBarFill, { width: `${xpPercent}%` }]} />
            </View>
          </View>
          <Text style={styles.levelMessage}>
            {t('home.levelProgress', { points: xpNeeded - xpProgress })}
          </Text>
        </View>

        {/* Course cards */}
        {activeEnrollments.map((enrollment: ApiEnrollment) => {
          const course = enrollment.course!
          const progress = enrollment.progressPercent
          const completedCount = enrollment.completedSections
          const totalCount = enrollment.totalSections

          return (
            <TouchableOpacity
              key={enrollment.id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(enrollment.courseId)}
              activeOpacity={0.82}
            >
              <View style={styles.courseHeader}>
                <Ionicons name="bar-chart" size={24} color="#141B1F" />
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course.title}
                </Text>
              </View>

              <View style={styles.courseDivider} />

              <View style={styles.courseMetadata}>
                <View style={styles.metadataRow}>
                  <Ionicons name="school-outline" size={14} color="#628397" />
                  <Text style={styles.metadataText} numberOfLines={1}>
                    {course.shortDescription}
                  </Text>
                </View>

                <View style={styles.metadataRow}>
                  <Ionicons name="time-outline" size={14} color="#628397" />
                  <Text style={styles.metadataText}>
                    {course.estimatedTime}
                  </Text>
                </View>
              </View>

              <View style={styles.courseProgressRow}>
                <View style={styles.courseProgressBar}>
                  <View
                    style={[
                      styles.courseProgressFill,
                      { width: `${progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressCount}>
                  {completedCount}/{totalCount}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#246670" />
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  logoMark: {
    width: 26,
    height: 26,
  },
  welcomeText: {
    flex: 1,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    color: '#141B1F',
  },
  // Level card
  levelCard: {
    backgroundColor: '#FDFEFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C1CFD7',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#246670',
  },
  levelBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#D8EFF3',
    borderRadius: 999,
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%',
    backgroundColor: '#246670',
    borderRadius: 999,
  },
  levelMessage: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    color: '#628397',
  },
  // Course card
  courseCard: {
    backgroundColor: '#FDFEFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EBF0F2',
    shadowColor: '#28363E',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  courseTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#141B1F',
  },
  courseDivider: {
    height: 1,
    backgroundColor: '#EBF0F2',
    marginBottom: 12,
  },
  courseMetadata: {
    gap: 6,
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: '#628397',
  },
  courseProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  courseProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#D8EFF3',
    borderRadius: 999,
    overflow: 'hidden',
  },
  courseProgressFill: {
    height: '100%',
    backgroundColor: '#246670',
    borderRadius: 999,
  },
  progressCount: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#28363E',
  },
  // Empty state
  emptyScroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  wordmark: {
    alignSelf: 'center',
    width: 180,
    height: 28,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    aspectRatio: 1007 / 502,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    color: '#141B1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    color: '#28363E',
    textAlign: 'center',
    marginBottom: 32,
  },
  exploreButton: {
    width: '100%',
    backgroundColor: '#35A1B1',
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  exploreButtonText: {
    color: '#FDFEFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
})
