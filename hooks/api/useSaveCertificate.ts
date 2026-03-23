import { API_BASE_URL } from '@/utils/api-config'
import { getDeviceId } from '@/utils/device-id'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface SaveCertificateParams {
  courseId: string
  courseName: string
  userName: string
  totalSections: number
}

interface CertificateResponse {
  id: string
  courseId: string
  deviceId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}

export function useSaveCertificate() {
  const queryClient = useQueryClient()

  return useMutation<CertificateResponse, Error, SaveCertificateParams>({
    mutationFn: async ({ courseId, courseName, userName, totalSections }) => {
      const deviceId = await getDeviceId()

      const response = await fetch(`${API_BASE_URL}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          deviceId,
          courseName,
          userName,
          totalSections,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save certificate: ${response.statusText}`)
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidate certificates query to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['certificates'],
      })
    },
  })
}
