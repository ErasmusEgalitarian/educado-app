import CourseCard from '@/components/Course/CourseCard'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { mockCourses } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { getCourseCompletionPercentage } from '@/utils/progress-storage'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function CoursesScreen() {
  const router = useRouter()
  const colors = AppColors()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentLanguage } = useLanguage()
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>(
    {}
  )

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    const progress: Record<string, number> = {}
    for (const course of mockCourses) {
      const percentage = await getCourseCompletionPercentage(
        course.id,
        course.sections.length
      )
      progress[course.id] = percentage
    }
    setCourseProgress(progress)
  }

  const handleCoursePress = (courseId: string) => {
    router.push(`/(tabs)/courses/${courseId}`)
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('home.title')}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {t('home.subtitle')}
          </Text>
        </View>

        {mockCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onPress={() => handleCoursePress(course.id)}
            progress={courseProgress[course.id] || 0}
          />
        ))}
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
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
})
