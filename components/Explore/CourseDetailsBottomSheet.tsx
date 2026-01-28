import { AppColors } from '@/constants/theme/AppColors'
import { Course } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import React, { forwardRef, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface CourseDetailsBottomSheetProps {
  course: Course | null
  isEnrolled: boolean
  onEnroll: () => void
  onViewCourse: () => void
  onChange?: (index: number) => void
}

const CourseDetailsBottomSheet = forwardRef<
  BottomSheet,
  CourseDetailsBottomSheetProps
>(({ course, isEnrolled, onEnroll, onViewCourse, onChange }, ref) => {
  const colors = AppColors()
  const snapPoints = useMemo(() => ['85%'], [])

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onChange={onChange}
      backgroundStyle={{
        backgroundColor: colors.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
      }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.contentContainer}>
        {course ? (
          <>
            <View style={styles.courseContainer}>
              {/* Course Title */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {course.title}
                </Text>
              </View>

              {/* Course Meta Information */}
              <View style={styles.metaContainer}>
                <View style={styles.metaRow}>
                  <Ionicons
                    name="school-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                  >
                    {course.shortDescription}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                  >
                    {course.estimatedTime}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.metaText, { color: colors.textSecondary }]}
                  >
                    {getDifficultyLabel(course.difficulty)}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  {renderStars(course.rating || 0)}
                  <Text
                    style={[styles.ratingText, { color: colors.textPrimary }]}
                  >
                    {course.rating?.toFixed(1)}
                  </Text>
                </View>
              </View>

              {/* Course Description */}
              <View style={styles.descriptionContainer}>
                <Text
                  style={[styles.description, { color: colors.textPrimary }]}
                >
                  {course.description}
                </Text>
              </View>

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {course.tags.map((tag, index) => (
                    <View
                      key={index}
                      style={[styles.tag, { backgroundColor: '#E0F2FE' }]}
                    >
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {/* Enroll Button */}
            <TouchableOpacity
              style={[
                styles.enrollButton,
                {
                  backgroundColor: isEnrolled
                    ? colors.primary
                    : colors.secondary,
                },
              ]}
              onPress={isEnrolled ? onViewCourse : onEnroll}
              activeOpacity={0.8}
            >
              <Text style={styles.enrollButtonText}>
                {isEnrolled ? t('explore.viewCourse') : t('explore.enrollNow')}
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheet>
  )
})

CourseDetailsBottomSheet.displayName = 'CourseDetailsBottomSheet'

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  courseContainer: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaContainer: {
    gap: 12,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 15,
    flex: 1,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '500',
  },
  enrollButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
})

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return t('explore.basic')
    case 'intermediate':
      return t('explore.intermediate')
    case 'advanced':
      return t('explore.advanced')
    default:
      return difficulty
  }
}

const renderStars = (rating: number) => {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Ionicons
        key={`full-${i}`}
        name="star"
        size={16}
        color="#FCD34D"
        style={styles.starIcon}
      />
    )
  }

  if (hasHalfStar) {
    stars.push(
      <Ionicons
        key="half"
        name="star-half"
        size={16}
        color="#FCD34D"
        style={styles.starIcon}
      />
    )
  }

  const emptyStars = 5 - Math.ceil(rating)
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Ionicons
        key={`empty-${i}`}
        name="star-outline"
        size={16}
        color="#FCD34D"
        style={styles.starIcon}
      />
    )
  }

  return stars
}
export default CourseDetailsBottomSheet
