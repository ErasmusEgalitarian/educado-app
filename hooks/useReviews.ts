import {
  apiSubmitReview,
  apiGetCourseReviews,
} from '@/services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useCourseReviews(courseId: string) {
  return useQuery({
    queryKey: ['reviews', courseId],
    queryFn: () => apiGetCourseReviews(courseId),
    enabled: !!courseId,
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      courseId: string
      rating: number
      tags: string[]
      comment: string | null
    }) => apiSubmitReview(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.courseId],
      })
    },
  })
}
