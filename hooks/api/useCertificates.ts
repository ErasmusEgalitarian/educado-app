import { API_BASE_URL } from '@/utils/api-config'
import { getDeviceId } from '@/utils/device-id'
import { useQuery } from '@tanstack/react-query'

export interface CertificateResponse {
  id: string
  courseId: string
  deviceId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}

export function useCertificates() {
  return useQuery<CertificateResponse[]>({
    queryKey: ['certificates'],
    queryFn: async () => {
      const deviceId = await getDeviceId()

      const response = await fetch(
        `${API_BASE_URL}/certificates/${deviceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch certificates: ${response.statusText}`)
      }

      return await response.json()
    },
  })
}
