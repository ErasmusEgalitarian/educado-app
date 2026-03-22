import {
  ApiCertificate,
  apiGetStudentCertificates,
} from '@/services/api'
import { useQuery } from '@tanstack/react-query'

/**
 * Fetch student certificates using JWT-based endpoint.
 */
export function useCertificates() {
  return useQuery<ApiCertificate[]>({
    queryKey: ['certificates'],
    queryFn: async () => {
      const response = await apiGetStudentCertificates()
      return response.certificates
    },
  })
}
