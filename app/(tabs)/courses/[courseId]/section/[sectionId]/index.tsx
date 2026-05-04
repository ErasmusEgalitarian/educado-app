import SectionActivityItem from '@/components/Course/SectionActivityItem'
import { AppColors } from '@/constants/theme/AppColors'
import { useCourse } from '@/hooks/useCourses'
import { useEnrollmentDetail } from '@/hooks/useProgress'
import { t } from '@/i18n/config'
import {
  getInitialSectionPhase,
  getSectionDescription,
  getSectionPhaseItems,
} from '@/utils/section-phases'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SectionOverviewScreen() {
  const { courseId, sectionId } = useLocalSearchParams<{
    courseId: string
    sectionId: string
  }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colors = AppColors()

  const { data: course, isLoading } = useCourse(courseId)
  const { data: enrollmentDetail } = useEnrollmentDetail(courseId)

  const section = useMemo(
    () => course?.sections.find((item) => item.id === sectionId),
    [course, sectionId]
  )

  const sectionProgress = enrollmentDetail?.sections.find(
    (item) => item.id === sectionId
  )
  const isCompleted = sectionProgress?.status === 'completed'

  const phaseItems = section ? getSectionPhaseItems(section) : []
  const initialPhase = section ? getInitialSectionPhase(section) : 'questions'
  const sectionDescription =
    (section && getSectionDescription(section)) ||
    course?.shortDescription ||
    section?.title ||
    ''

  if (isLoading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: colors.backgroundPrimary }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

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

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 84 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color="#28363E" />
          </TouchableOpacity>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {course.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionDescription}>{sectionDescription}</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.activities}>
          {phaseItems.map((item) => {
            const isLocked = !isCompleted && item.id !== initialPhase

            return (
              <SectionActivityItem
                key={item.id}
                title={item.title}
                kind={item.kind}
                isCompleted={isCompleted}
                isLocked={isLocked}
                onPress={() =>
                  router.push({
                    pathname:
                      '/(tabs)/courses/[courseId]/section/[sectionId]/learn',
                    params: {
                      courseId,
                      sectionId,
                      startPhase: item.id,
                    },
                  })
                }
              />
            )
          })}
        </View>
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
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  courseTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '400',
    color: '#28363E',
  },
  headerSpacer: {
    width: 24,
  },
  heroBlock: {
    marginBottom: 28,
  },
  sectionTitle: {
    width: '100%',
    fontSize: 34,
    lineHeight: 46,
    fontWeight: '700',
    color: '#383838',
    marginBottom: 10,
    paddingBottom: 2,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
    color: '#383838',
  },
  divider: {
    height: 1,
    backgroundColor: '#D8EFF3',
    marginTop: 20,
  },
  activities: {
    paddingTop: 12,
  },
})
