import CourseDetailsBottomSheet from '@/components/Explore/CourseDetailsBottomSheet'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { Course, mockCourses } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { enrollInCourse, isEnrolledInCourse } from '@/utils/enrollment-storage'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function ExploreScreen() {
  const colors = AppColors()
  const { currentLanguage } = useLanguage()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const bottomSheetRef = useRef<BottomSheet>(null)

  const categories = [
    { id: 'all', label: t('explore.all') },
    { id: 'finance', label: t('explore.finance') },
    { id: 'arts', label: t('explore.arts') },
    { id: 'history', label: t('explore.history') },
    { id: 'science', label: t('explore.science') },
  ]

  useEffect(() => {
    loadEnrollments()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      bottomSheetRef.current?.expand()
    }
  }, [selectedCourse])

  const loadEnrollments = async () => {
    const enrolled: string[] = []
    for (const course of mockCourses) {
      const isEnrolled = await isEnrolledInCourse(course.id)
      if (isEnrolled) {
        enrolled.push(course.id)
      }
    }
    setEnrolledCourses(enrolled)
  }

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedCategory(categoryId)
  }

  const handleCoursePress = (course: Course) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedCourse(course)
  }

  const handleEnroll = async () => {
    if (!selectedCourse) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    await enrollInCourse(selectedCourse.id)
    setEnrolledCourses([...enrolledCourses, selectedCourse.id])

    // Close bottom sheet and navigate to course
    bottomSheetRef.current?.close()
    router.push(`/(tabs)/courses/${selectedCourse.id}`)
  }

  const handleViewCourse = () => {
    if (!selectedCourse) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    bottomSheetRef.current?.close()
    router.push(`/(tabs)/courses/${selectedCourse.id}`)
  }

  const handleBottomSheetChange = (index: number) => {
    // When bottom sheet is fully closed (index -1), reset selected course
    if (index === -1) {
      setSelectedCourse(null)
    }
  }

  const filteredCourses = mockCourses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Image
                source={require('@/assets/images/logo_black240.png')}
                style={styles.logo}
                contentFit="contain"
              />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {t('explore.title')}
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={t('explore.searchPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Ionicons name="search" size={20} color={colors.textSecondary} />
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    isSelected && styles.categoryButtonActive,
                    {
                      backgroundColor: isSelected ? '#4A90A4' : 'transparent',
                      borderColor: isSelected ? '#4A90A4' : '#D1D5DB',
                    },
                  ]}
                  onPress={() => handleCategoryPress(category.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Course Cards */}
          {filteredCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseCard,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={() => handleCoursePress(course)}
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
                <Ionicons
                  name="chevron-down"
                  size={24}
                  color={colors.textSecondary}
                />
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

                <View style={styles.metadataRow}>
                  <Ionicons
                    name="trending-up"
                    size={18}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.metadataText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t('explore.basic')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bottom Sheet */}
        <CourseDetailsBottomSheet
          ref={bottomSheetRef}
          course={selectedCourse}
          isEnrolled={
            selectedCourse ? enrolledCourses.includes(selectedCourse.id) : false
          }
          onEnroll={handleEnroll}
          onViewCourse={handleViewCourse}
          onChange={handleBottomSheetChange}
        />
      </View>
    </GestureHandlerRootView>
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
    padding: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 50,
    height: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonActive: {
    borderWidth: 0,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  courseCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 3,
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
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 15,
    flex: 1,
  },
})
