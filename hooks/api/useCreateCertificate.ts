import { API_BASE_URL } from '@/utils/api-config'
import { Certificate } from '@/utils/progress-storage'
import { getUsername } from '@/utils/user-storage'
import { useMutation } from '@tanstack/react-query'

export function useCreateCertificate() {
  return useMutation({
    mutationFn: async (certificate: Certificate) => {
      const username = await getUsername()
      if (!username) {
        throw new Error('No username found')
      }

      const response = await fetch(`${API_BASE_URL}/certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: certificate.courseId,
          username,
          courseName: certificate.courseName,
          userName: certificate.userName,
          totalSections: certificate.totalSections,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // 409 means certificate already exists, which is fine
        if (response.status === 409) {
          return errorData.certificate
        }
        throw new Error(errorData.error || 'Failed to sync certificate')
      }

      return await response.json()
    },
  })
}
