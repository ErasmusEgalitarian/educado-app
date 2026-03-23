import { API_BASE_URL } from '@/utils/api-config'
import { getUsername } from '@/utils/user-storage'
import { useQuery } from '@tanstack/react-query'

interface BackendCertificate {
  courseId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}

export function useGetCertificate(courseId: string) {
  return useQuery({
    queryKey: ['certificate', courseId],
    queryFn: async (): Promise<BackendCertificate | null> => {
      const username = await getUsername()
      if (!username) {
        return null
      }

      const response = await fetch(
        `${API_BASE_URL}/certificates/${username}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch certificate')
      }

      const certificates = (await response.json()) as BackendCertificate[]
      const certificate = certificates.find((cert) => cert.courseId === courseId)
      return certificate || null
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
