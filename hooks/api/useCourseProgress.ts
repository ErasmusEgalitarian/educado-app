import { API_BASE_URL } from '@/utils/api-config'
import { getDeviceId } from '@/utils/device-id'
import { useQuery } from '@tanstack/react-query'

export interface CourseProgressResponse {
  id: string
  courseId: string
  deviceId: string
  startedAt: string
  lastAccessedAt: string
  completedAt: string | null
  sections: SectionProgressResponse[]
}

export interface SectionProgressResponse {
  id: string
  courseProgressId: string
  sectionId: string
  completed: boolean
  score: number
  totalQuestions: number
  completedAt: string | null
}

export function useCourseProgress(courseId: string | undefined) {
  return useQuery<CourseProgressResponse | null>({
    queryKey: ['courseProgress', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required')
      const deviceId = await getDeviceId()

      const response = await fetch(
        `${API_BASE_URL}/progress/${deviceId}/courses/${courseId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // Return null if progress not found (404)
      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch course progress: ${response.statusText}`
        )
      }

      return await response.json()
    },
    enabled: !!courseId,
  })
}

export function useAllCourseProgress() {
  return useQuery<CourseProgressResponse[]>({
    queryKey: ['allCourseProgress'],
    queryFn: async () => {
      const deviceId = await getDeviceId()

      const response = await fetch(
        `${API_BASE_URL}/progress/${deviceId}/courses`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch all course progress: ${response.statusText}`
        )
      }

      return await response.json()
    },
  })
}
