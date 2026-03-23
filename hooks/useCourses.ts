import { Course, Question, Section, VideoPauseQuestion } from '@/data/mock-data'
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

// Detect effective question type for an activity (video_pause can be either MC or TF)
function getEffectiveQuestionType(
  activity: ApiActivity
): 'multiple_choice' | 'true_false' {
  if (activity.type === 'multiple_choice') return 'multiple_choice'
  if (activity.type === 'true_false') return 'true_false'
  // video_pause: detect from data
  if (activity.options && activity.options.length > 0) return 'multiple_choice'
  return 'true_false'
}

// Coerce correctAnswer from API (may arrive as string "true"/"false" from JSON)
function coerceCorrectAnswer(
  value: number | boolean | null,
  effectiveType: 'multiple_choice' | 'true_false'
): number | boolean {
  if (effectiveType === 'true_false') {
    if (typeof value === 'string') return value === 'true'
    if (typeof value === 'boolean') return value
    return Boolean(value ?? false)
  }
  return Number(value) || 0
}

// Transform API activity → app Question
function transformActivity(activity: ApiActivity): Question {
  const effectiveType = getEffectiveQuestionType(activity)
  return {
    id: activity.id,
    type: effectiveType,
    question: activity.question || '',
    options: activity.options || [],
    correctAnswer: coerceCorrectAnswer(
      activity.correctAnswer ?? null,
      effectiveType
    ),
    icon: activity.icon || undefined,
    imageUrl: activity.imageMediaId
      ? getImageUrl(activity.imageMediaId)
      : undefined,
  }
}

// Check if an activity is a question (MC, TF, or video_pause final question without timestamp)
function isRegularQuestion(a: ApiActivity): boolean {
  if (a.type === 'multiple_choice' || a.type === 'true_false') return true
  // video_pause without pauseTimestamp = "final question" shown after video
  if (a.type === 'video_pause' && a.pauseTimestamp == null && a.question != null) return true
  return false
}

// Transform API section → app Section
function transformSection(section: ApiSection): Section {
  const sorted = (section.activities || []).sort((a, b) => a.order - b.order)

  // Regular questions: MC, TF, and video_pause "final questions" (no timestamp)
  const questions = sorted
    .filter(isRegularQuestion)
    .map(transformActivity)

  // Aggregate text pages from text_reading activities (in order)
  const textPages = sorted
    .filter((a) => a.type === 'text_reading' && a.textPages)
    .flatMap((a) => a.textPages!)

  // Video pause questions: only those WITH a specific timestamp
  const videoPauseQuestions: VideoPauseQuestion[] = sorted
    .filter(
      (a) =>
        a.type === 'video_pause' &&
        a.pauseTimestamp != null &&
        a.question != null
    )
    .map((a) => ({
      pauseTimestamp: a.pauseTimestamp!,
      question: transformActivity(a),
    }))

  return {
    id: section.id,
    title: section.title,
    videoUrl: section.videoMediaId
      ? getVideoStreamUrl(section.videoMediaId)
      : '',
    thumbnailUrl: section.thumbnailMediaId
      ? getImageUrl(section.thumbnailMediaId)
      : '',
    duration: section.duration || 0,
    questions,
    textPages: textPages.length > 0 ? textPages : undefined,
    videoPauseQuestions:
      videoPauseQuestions.length > 0 ? videoPauseQuestions : undefined,
  }
}

// Transform API course → app Course
function transformCourse(apiCourse: ApiCourse): Course {
  const sections = (apiCourse.sections || [])
    .sort((a, b) => a.order - b.order)
    .map((s) => transformSection(s))

  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description,
    shortDescription: apiCourse.shortDescription,
    imageUrl: apiCourse.imageMediaId
      ? getImageUrl(apiCourse.imageMediaId)
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
  return useQuery<Course[]>({
    queryKey: ['catalog-courses', params],
    queryFn: async () => {
      const response = await apiGetCatalogCourses(params)
      return response.items.map((c) => transformCourse(c))
    },
  })
}

// Transform for offline: use local file URIs instead of streaming URLs
function transformCourseOffline(apiCourse: ApiCourse): Course {
  const sections = (apiCourse.sections || [])
    .sort((a, b) => a.order - b.order)
    .map((section): Section => {
      const sorted = (section.activities || []).sort((a, b) => a.order - b.order)

      const questions = sorted
        .filter(isRegularQuestion)
        .map(transformActivity)

      const textPages = sorted
        .filter((a) => a.type === 'text_reading' && a.textPages)
        .flatMap((a) => a.textPages!)

      const videoPauseQuestions: VideoPauseQuestion[] = sorted
        .filter(
          (a) =>
            a.type === 'video_pause' &&
            a.pauseTimestamp != null &&
            a.question != null
        )
        .map((a) => ({
          pauseTimestamp: a.pauseTimestamp!,
          question: transformActivity(a),
        }))

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
        textPages: textPages.length > 0 ? textPages : undefined,
        videoPauseQuestions:
          videoPauseQuestions.length > 0 ? videoPauseQuestions : undefined,
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
  return useQuery<Course | undefined>({
    queryKey: ['catalog-course', courseId],
    queryFn: async () => {
      try {
        const apiCourse = await apiGetCatalogCourseDetail(courseId)
        return transformCourse(apiCourse)
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
