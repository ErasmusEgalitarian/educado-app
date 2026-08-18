import {
  ApiEnrollment,
  ApiEnrollmentDetail,
  apiGetEnrollments,
  apiGetEnrollmentDetail,
  apiSaveStudentSectionProgress,
  apiCompleteStudentCourse,
  apiEnroll,
  apiDropEnrollment,
} from '@/services/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * List all enrollments (replaces username-based progress listing).
 */
export function useEnrollments() {
  return useQuery<ApiEnrollment[]>({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await apiGetEnrollments()
      return response.enrollments
    },
  })
}

/**
 * Get detailed enrollment with sections and progress.
 */
export function useEnrollmentDetail(courseId: string) {
  return useQuery<ApiEnrollmentDetail>({
    queryKey: ['enrollment-detail', courseId],
    queryFn: () => apiGetEnrollmentDetail(courseId),
    enabled: !!courseId,
    retry: false,
  })
}

/**
 * Enroll in a course.
 */
export function useEnroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => apiEnroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-courses'] })
    },
  })
}

/**
 * Drop enrollment from a course.
 */
export function useDropEnrollment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => apiDropEnrollment(courseId),
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({
        queryKey: ['enrollment-detail', courseId],
      })
    },
  })
}

/**
 * Save section progress (score + totalQuestions).
 */
export function useSaveSectionProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      courseId,
      sectionId,
      score,
      totalQuestions,
    }: {
      courseId: string
      sectionId: string
      score: number
      totalQuestions: number
    }) =>
      apiSaveStudentSectionProgress(courseId, sectionId, score, totalQuestions),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollment-detail', variables.courseId],
      })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['gamification-summary'] })
    },
  })
}

/**
 * Mark course as completed.
 */
export function useCompleteCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => apiCompleteStudentCourse(courseId),
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({
        queryKey: ['enrollment-detail', courseId],
      })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
      queryClient.invalidateQueries({ queryKey: ['gamification-summary'] })
    },
  })
}
