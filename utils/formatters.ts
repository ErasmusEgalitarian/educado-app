/**
 * Format duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted string like "3 min" or "1h 30min"
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}

/**
 * Format date to readable format
 * @param dateString ISO date string
 * @returns Formatted date like "Jan 25, 2026"
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date to long format for certificates
 * @param dateString ISO date string
 * @returns Formatted date like "January 25, 2026"
 */
export const formatLongDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Get percentage as string
 * @param current Current value
 * @param total Total value
 * @returns Percentage string like "75%"
 */
export const formatPercentage = (current: number, total: number): string => {
  if (total === 0) return '0%'
  const percentage = Math.round((current / total) * 100)
  return `${percentage}%`
}

/**
 * Format score display
 * @param score User's score
 * @param total Total possible score
 * @returns Formatted string like "3/5"
 */
export const formatScore = (score: number, total: number): string => {
  return `${score}/${total}`
}
