import { API_BASE_URL } from '@/utils/api-config'
import { getUsername } from '@/utils/user-storage'
import { useQuery } from '@tanstack/react-query'

export interface CertificateResponse {
  id: string
  courseId: string
  userId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}

export function useCertificates() {
  return useQuery<CertificateResponse[]>({
    queryKey: ['certificates'],
    queryFn: async () => {
      const username = await getUsername()

      if (!username) {
        throw new Error('No username found')
      }

      const response = await fetch(`${API_BASE_URL}/certificates/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.statusText}`)
      }

      return await response.json()
    },
  })
}
