import { Course } from '@/data/mock-data'
import { API_BASE_URL } from '@/utils/api-config'
import { useQuery } from '@tanstack/react-query'

export function useCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.statusText}`)
      }

      return await response.json()
    },
  })
}
