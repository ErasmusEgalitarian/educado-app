import { AppColors } from '@/constants/theme/AppColors'
import { Course } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { getCourseImage } from '@/utils/image-loader'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ProgressBar from '../Common/ProgressBar'

interface CourseCardProps {
  course: Course
  onPress: () => void
  progress?: number // 0-100
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  progress = 0,
}) => {
  const colors = AppColors()

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const getDifficultyIcon = () => {
    switch (course.difficulty) {
      case 'beginner':
        return 'leaf-outline'
      case 'intermediate':
        return 'bar-chart-outline'
      case 'advanced':
        return 'trophy-outline'
      default:
        return 'information-circle-outline'
    }
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.cardBackground }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getCourseImage(course.imageUrl)}
          style={styles.image}
          contentFit="cover"
        />
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          numberOfLines={2}
        >
          {course.title}
        </Text>

        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {course.shortDescription}
        </Text>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Ionicons
              name="book-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.metadataText, { color: colors.textSecondary }]}
            >
              {course.sections.length} {t('common.sections')}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.metadataText, { color: colors.textSecondary }]}
            >
              {course.estimatedTime}
            </Text>
          </View>

          <View style={styles.metadataItem}>
            <Ionicons
              name={getDifficultyIcon()}
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.metadataText, { color: colors.textSecondary }]}
            >
              {course.difficulty.charAt(0).toUpperCase() +
                course.difficulty.slice(1)}
            </Text>
          </View>
        </View>

        {progress > 0 && (
          <View style={styles.progressContainer}>
            <ProgressBar
              current={progress}
              total={100}
              showLabel={false}
              height={6}
            />
            <Text
              style={[styles.progressText, { color: colors.textSecondary }]}
            >
              {progress}% complete
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
})

export default CourseCard
