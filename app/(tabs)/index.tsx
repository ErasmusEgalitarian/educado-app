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
  const levelName = gamification?.levelName ?? ''
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
        <Text style={[styles.emptyStateText, { color: colors.textPrimary }]}>
          {t('offline.title')}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 15,
            textAlign: 'center',
            marginTop: 8,
            paddingHorizontal: 32,
            lineHeight: 22,
          }}
        >
          {t('offline.message')}
        </Text>
        <TouchableOpacity
          style={[styles.exploreButton, { marginTop: 24 }]}
          onPress={() => router.push('/(tabs)/downloads')}
          activeOpacity={0.7}
        >
          <Text style={styles.exploreButtonText}>
            {t('offline.goToDownloads')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 12 }}
          onPress={() => refetchEnrollments()}
          activeOpacity={0.7}
        >
          <Text
            style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}
          >
            {t('offline.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Show message if no enrolled courses
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
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <View style={styles.welcomeContainer}>
              <Image
                source={require('@/assets/images/logo_black240.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <Text
                style={[styles.welcomeText, { color: colors.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Logo and Welcome */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Image
              source={require('@/assets/images/logo_black240.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text
              style={[styles.welcomeText, { color: colors.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('home.welcome')}
            </Text>
          </View>
        </View>

        {/* Level Progress Card */}
        <View
          style={[styles.levelCard, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.levelTitle, { color: '#4A90A4' }]}>
            {t('home.level', { level: currentLevel })}
            {levelName ? ` — ${levelName}` : ''}
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${xpPercent}%` }]}
              />
            </View>
          </View>
          <Text
            style={[styles.levelProgressText, { color: colors.textSecondary }]}
          >
            {t('home.levelProgress', { points: xpNeeded - xpProgress })}
          </Text>
        </View>

        {/* Course Cards */}
        {activeEnrollments.map((enrollment: ApiEnrollment) => {
          const course = enrollment.course!
          const progress = enrollment.progressPercent
          const completedCount = enrollment.completedSections
          const totalCount = enrollment.totalSections

          return (
            <TouchableOpacity
              key={enrollment.id}
              style={[
                styles.courseCard,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => handleCoursePress(enrollment.courseId)}
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
                  numberOfLines={2}
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
                    numberOfLines={2}
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minWidth: 0,
  },
  logo: {
    width: 50,
    height: 50,
  },
  welcomeText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
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
    flexShrink: 1,
    minWidth: 0,
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
    alignItems: 'flex-start',
    gap: 8,
  },
  metadataText: {
    fontSize: 15,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
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
