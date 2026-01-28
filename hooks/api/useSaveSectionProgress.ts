import { API_BASE_URL } from '@/utils/api-config'
import { getDeviceId } from '@/utils/device-id'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface SaveSectionProgressParams {
  courseId: string
  sectionId: string
  score: number
  totalQuestions: number
}

interface SectionProgressResponse {
  id: string
  courseProgressId: string
  sectionId: string
  completed: boolean
  score: number
  totalQuestions: number
  completedAt: string | null
}

export function useSaveSectionProgress() {
  const queryClient = useQueryClient()

  return useMutation<SectionProgressResponse, Error, SaveSectionProgressParams>(
    {
      mutationFn: async ({ courseId, sectionId, score, totalQuestions }) => {
        const deviceId = await getDeviceId()

        const response = await fetch(
          `${API_BASE_URL}/progress/${deviceId}/courses/${courseId}/sections/${sectionId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ score, totalQuestions }),
          }
        )

        if (!response.ok) {
          throw new Error(
            `Failed to save section progress: ${response.statusText}`
          )
        }

        return await response.json()
      },
      onSuccess: (_, variables) => {
        // Invalidate course progress queries to refetch updated data
        queryClient.invalidateQueries({
          queryKey: ['courseProgress', variables.courseId],
        })
        queryClient.invalidateQueries({
          queryKey: ['allCourseProgress'],
        })
      },
    }
  )
}
