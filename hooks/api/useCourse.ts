import { Course } from '@/data/mock-data'
import { API_BASE_URL } from '@/utils/api-config'
import { useQuery } from '@tanstack/react-query'

export function useCourse(courseId: string | undefined) {
  return useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID is required')

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.statusText}`)
      }

      return await response.json()
    },
    enabled: !!courseId,
  })
}
