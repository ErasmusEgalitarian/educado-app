import { useAuth } from '@/contexts/AuthContext'
import { Course, Question, Section } from '@/data/mock-data'
import {
  ApiActivity,
  ApiCourse,
  ApiSection,
  apiGetCatalogCourses,
  apiGetCatalogCourseDetail,
  apiGetCatalogCategories,
  getImageUrl,
  getVideoStreamUrl,
} from '@/services/api'
import {
  getOfflineCourse,
  getLocalMediaUri,
} from '@/services/download-manager'
import { useQuery } from '@tanstack/react-query'

// Transform API activity → app Question
function transformActivity(activity: ApiActivity): Question {
  return {
    id: activity.id,
    type: activity.type as 'multiple_choice' | 'true_false',
    question: activity.question || '',
    options: activity.options || [],
    correctAnswer: activity.correctAnswer as number | boolean,
    icon: activity.icon || undefined,
  }
}

// Transform API section → app Section
function transformSection(section: ApiSection, token?: string): Section {
  const questions = (section.activities || [])
    .filter((a) => a.type === 'multiple_choice' || a.type === 'true_false')
    .sort((a, b) => a.order - b.order)
    .map(transformActivity)

  return {
    id: section.id,
    title: section.title,
    videoUrl: section.videoMediaId
      ? getVideoStreamUrl(section.videoMediaId, token || undefined)
      : '',
    thumbnailUrl: section.thumbnailMediaId
      ? getImageUrl(section.thumbnailMediaId, token || undefined)
      : '',
    duration: section.duration || 0,
    questions,
  }
}

// Transform API course → app Course
function transformCourse(apiCourse: ApiCourse, token?: string): Course {
  const sections = (apiCourse.sections || [])
    .sort((a, b) => a.order - b.order)
    .map((s) => transformSection(s, token))

  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description,
    shortDescription: apiCourse.shortDescription,
    imageUrl: apiCourse.imageMediaId
      ? getImageUrl(apiCourse.imageMediaId, token || undefined)
      : '',
    sections,
    difficulty: apiCourse.difficulty,
    estimatedTime: apiCourse.estimatedTime,
    passingThreshold: apiCourse.passingThreshold || 75,
    category: apiCourse.category,
    rating: apiCourse.rating || undefined,
    tags:
      apiCourse.reusableTags?.map((t) => t.name) ||
      apiCourse.tags ||
      [],
    enrollmentCount: apiCourse.enrollmentCount,
  }
}

/**
 * Fetch all active courses from the PUBLIC catalog endpoint.
 * This works for both authenticated students and unauthenticated users.
 */
export function useAllCourses(params?: Record<string, string>) {
  const { token } = useAuth()

  return useQuery<Course[]>({
    queryKey: ['catalog-courses', params],
    queryFn: async () => {
      const response = await apiGetCatalogCourses(params)
      return response.items.map((c) =>
        transformCourse(c, token || undefined)
      )
    },
  })
}

// Transform for offline: use local file URIs instead of streaming URLs
function transformCourseOffline(apiCourse: ApiCourse): Course {
  const sections = (apiCourse.sections || [])
    .sort((a, b) => a.order - b.order)
    .map((section): Section => {
      const questions = (section.activities || [])
        .filter((a) => a.type === 'multiple_choice' || a.type === 'true_false')
        .sort((a, b) => a.order - b.order)
        .map(transformActivity)

      return {
        id: section.id,
        title: section.title,
        videoUrl: section.videoMediaId
          ? getLocalMediaUri(apiCourse.id, section.videoMediaId, 'video')
          : '',
        thumbnailUrl: section.thumbnailMediaId
          ? getLocalMediaUri(apiCourse.id, section.thumbnailMediaId, 'image')
          : '',
        duration: section.duration || 0,
        questions,
      }
    })

  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description,
    shortDescription: apiCourse.shortDescription,
    imageUrl: apiCourse.imageMediaId
      ? getLocalMediaUri(apiCourse.id, apiCourse.imageMediaId, 'image')
      : '',
    sections,
    difficulty: apiCourse.difficulty,
    estimatedTime: apiCourse.estimatedTime,
    passingThreshold: apiCourse.passingThreshold || 75,
    category: apiCourse.category,
    rating: apiCourse.rating || undefined,
    tags:
      apiCourse.reusableTags?.map((t) => t.name) ||
      apiCourse.tags ||
      [],
    enrollmentCount: apiCourse.enrollmentCount,
  }
}

/**
 * Fetch a single course detail from the PUBLIC catalog endpoint.
 * Falls back to offline cached data if API fails.
 */
export function useCourse(courseId: string) {
  const { token } = useAuth()

  return useQuery<Course | undefined>({
    queryKey: ['catalog-course', courseId],
    queryFn: async () => {
      try {
        const apiCourse = await apiGetCatalogCourseDetail(courseId)
        return transformCourse(apiCourse, token || undefined)
      } catch {
        // Fallback to offline data
        const offlineCourse = await getOfflineCourse(courseId)
        if (offlineCourse) {
          return transformCourseOffline(offlineCourse)
        }
        return undefined
      }
    },
    enabled: !!courseId,
  })
}

/**
 * Fetch available course categories.
 */
export function useCategories() {
  return useQuery<string[]>({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const response = await apiGetCatalogCategories()
      return response.categories
    },
  })
}
