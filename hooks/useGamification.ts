import {
  ApiGamificationSummary,
  apiGetGamificationSummary,
  apiGetBadges,
  apiGetPointsHistory,
} from '@/services/api'
import { useQuery } from '@tanstack/react-query'

export function useGamificationSummary() {
  return useQuery<ApiGamificationSummary>({
    queryKey: ['gamification-summary'],
    queryFn: () => apiGetGamificationSummary(),
  })
}

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await apiGetBadges()
      return response.badges
    },
  })
}

export function usePointsHistory(page = 1) {
  return useQuery({
    queryKey: ['points-history', page],
    queryFn: () => apiGetPointsHistory(page),
  })
}
