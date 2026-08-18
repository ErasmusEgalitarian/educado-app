import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCourse } from '@/hooks/useCourses'
import { useHasReviewed, useSubmitReview } from '@/hooks/useReviews'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TAG_KEYS = [
  'tagContent',
  'tagTeacher',
  'tagPractice',
  'tagMaterial',
  'tagPace',
] as const

export default function ReviewScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>()
  const router = useRouter()
  const colors = AppColors()
  const insets = useSafeAreaInsets()
  const { currentLanguage } = useLanguage()

  const { data: course } = useCourse(courseId)
  const { data: hasReviewed } = useHasReviewed(courseId)
  const submitReviewMutation = useSubmitReview()

  // Skip review screen if already reviewed
  useEffect(() => {
    if (hasReviewed === true) {
      router.replace(`/(tabs)/courses/${courseId}/certificate`)
    }
  }, [hasReviewed, courseId, router])

  const [rating, setRating] = useState(0)
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>([])
  const [comment, setComment] = useState('')

  const handleStarPress = (star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRating(star)
  }

  const handleTagPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedTagKeys((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key].slice(0, 5)
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    try {
      await submitReviewMutation.mutateAsync({
        courseId,
        rating,
        tags: selectedTagKeys,
        comment: comment.trim() || null,
      })
      router.replace(`/(tabs)/courses/${courseId}/certificate`)
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'))
    }
  }

  const handleSkip = () => {
    router.replace(`/(tabs)/courses/${courseId}/certificate`)
  }

  return (
    <KeyboardAvoidingView
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.placeholder} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('review.title')}
        </Text>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.primary }]}>
            {t('review.skip')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Course name */}
        {course && (
          <Text style={[styles.courseName, { color: colors.textPrimary }]}>
            {course.title}
          </Text>
        )}

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('review.subtitle')}
        </Text>

        {/* Star Rating */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
          {t('review.ratingLabel')}
        </Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={44}
                color={star <= rating ? '#FCD34D' : '#D1D5DB'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
          {t('review.tagsLabel')}
        </Text>
        <View style={styles.tagsContainer}>
          {TAG_KEYS.map((key) => {
            const label = t(`review.${key}`)
            const isSelected = selectedTagKeys.includes(key)
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tag,
                  {
                    backgroundColor: isSelected
                      ? colors.primary
                      : 'transparent',
                    borderColor: isSelected ? colors.primary : '#D1D5DB',
                  },
                ]}
                onPress={() => handleTagPress(key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Comment */}
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
          {t('review.commentLabel')}
        </Text>
        <TextInput
          style={[
            styles.commentInput,
            {
              color: colors.textPrimary,
              backgroundColor: colors.cardBackground,
              borderColor: '#E5E7EB',
            },
          ]}
          placeholder={t('review.commentPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </ScrollView>

      {/* Submit Button */}
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
          title={t('review.submit')}
          onPress={handleSubmit}
          icon="send"
          fullWidth
          disabled={rating === 0}
          loading={submitReviewMutation.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 44,
  },
  skipButton: {
    width: 44,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 24,
  },
  courseName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    minHeight: 120,
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
})
