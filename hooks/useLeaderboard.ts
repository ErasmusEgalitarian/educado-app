import {
  ApiLeaderboardResult,
  apiGetGlobalLeaderboard,
  apiGetCourseLeaderboard,
} from '@/services/api'
import { useQuery } from '@tanstack/react-query'

export function useGlobalLeaderboard(month?: string) {
  return useQuery<ApiLeaderboardResult>({
    queryKey: ['leaderboard-global', month],
    queryFn: () => apiGetGlobalLeaderboard(month),
  })
}

export function useCourseLeaderboard(courseId: string, month?: string) {
  return useQuery<ApiLeaderboardResult>({
    queryKey: ['leaderboard-course', courseId, month],
    queryFn: () => apiGetCourseLeaderboard(courseId, month),
    enabled: !!courseId,
  })
}
