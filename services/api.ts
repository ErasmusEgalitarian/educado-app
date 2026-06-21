import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL as API_URL } from '@/utils/api-config'
import {
  getSecureToken,
  setSecureToken,
  removeSecureToken,
} from './secure-storage'

const USER_KEY = '@educado:user'
const DEVICE_ID_KEY = '@educado:deviceId'

// ============================================================
// Types
// ============================================================

export interface ApiUser {
  id: string
  firstName: string
  lastName: string
  email: string
  username: string | null
  avatarMediaId: string | null
}

export interface ApiLoginResponse {
  accessToken: string
  user: {
    id: string
    firstName: string
    lastName: string
    email?: string
    role?: string
    status?: string
    avatarMediaId?: string | null
  }
}

export interface ApiStudentAuthResponse {
  accessToken: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface ApiCourseTag {
  id: string
  name: string
  slug: string
}

export interface ApiActivity {
  id: string
  sectionId: string
  title: string | null
  type:
    | 'video_pause'
    | 'true_false'
    | 'text_reading'
    | 'multiple_choice'
    | 'image_association'
  order: number
  pauseTimestamp: number | null
  textPages: string[] | null
  question: string | null
  imageMediaId: string | null
  options: string[] | null
  correctAnswer: number | boolean | null
  icon: string | null
}

export interface ApiSection {
  id: string
  courseId: string
  title: string
  videoMediaId: string | null
  thumbnailMediaId: string | null
  duration: number | null
  order: number
  activities?: ApiActivity[]
}

export interface ApiCourse {
  id: string
  ownerId?: string
  title: string
  description: string
  shortDescription: string
  imageMediaId: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  passingThreshold: number
  category: string
  rating: number | null
  isActive?: boolean
  publishedAt?: string | null
  sections?: ApiSection[]
  reusableTags?: ApiCourseTag[]
  tags?: string[]
  enrollmentCount?: number
}

export interface ApiCourseProgress {
  id: string
  courseId: string
  userId: string
  startedAt: string
  lastAccessedAt: string
  completedAt: string | null
  sectionProgresses?: ApiSectionProgress[]
}

export interface ApiSectionProgress {
  id: string
  courseProgressId: string
  sectionId: string
  completedAt: string | null
  completed?: boolean
  score?: number
  totalQuestions?: number
}

export interface ApiCertificate {
  id: string
  courseId: string
  userId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
  hasPdf?: boolean
  verificationCode?: string | null
  course?: { id: string; title: string; imageMediaId: string } | null
}

export interface ApiProfile {
  firstName: string
  lastName: string
  email: string
  avatarMediaId: string | null
  motivations: string | null
  academicBackground: string | null
  professionalExperience: string | null
}

export interface ApiStudentProfile {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  avatarMediaId: string | null
  deviceId: string | null
  createdAt: string
}

export interface ApiEnrollment {
  id: string
  courseId: string
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
  enrolledAt: string
  completedAt: string | null
  progressPercent: number
  completedSections: number
  totalSections: number
  course: {
    id: string
    title: string
    shortDescription: string
    imageMediaId: string
    difficulty: string
    estimatedTime: string
    category: string
    rating: number | null
  } | null
}

export interface ApiEnrollmentDetail {
  enrollment: {
    id: string
    status: string
    enrolledAt: string
    completedAt: string | null
  }
  course: {
    id: string
    title: string
    description: string
    imageMediaId: string
    difficulty: string
    estimatedTime: string
    passingThreshold: number
  }
  progressPercent: number
  completedSections: number
  totalSections: number
  sections: {
    id: string
    title: string
    order: number
    duration: number | null
    videoMediaId: string | null
    thumbnailMediaId: string | null
    status: 'completed' | 'in_progress' | 'locked'
    score: number | null
    totalQuestions: number | null
  }[]
}

export interface ApiGamificationSummary {
  totalPoints: number
  currentLevel: number
  levelName: string
  xpProgress: number
  xpNeeded: number
  currentStreak: number
  longestStreak: number
  coursesCompleted: number
  sectionsCompleted: number
  recentBadges: {
    id: string
    key: string
    name: string
    description: string
    iconUrl: string | null
    earnedAt: string
  }[]
}

export interface ApiLeaderboardEntry {
  rank: number
  userId: string
  firstName: string
  lastName: string
  avatarMediaId: string | null
  points: number
}

export interface ApiLeaderboardResult {
  month: string
  entries: ApiLeaderboardEntry[]
  userRank: ApiLeaderboardEntry | null
  total: number
}

export interface ApiReviewItem {
  id: string
  rating: number
  tags: string[]
  comment: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    avatarMediaId: string | null
  } | null
}

export interface ApiAnswerResult {
  activityId: string
  correct: boolean
  correctAnswer: number | boolean | null
  attempts: number
}

// ============================================================
// Token & User management
// ============================================================

export const getStoredToken = async (): Promise<string | null> => {
  return getSecureToken()
}

export const storeToken = async (token: string): Promise<void> => {
  await setSecureToken(token)
}

export const removeToken = async (): Promise<void> => {
  await removeSecureToken()
}

export const getStoredUser = async (): Promise<ApiUser | null> => {
  const data = await AsyncStorage.getItem(USER_KEY)
  return data ? JSON.parse(data) : null
}

export const storeUser = async (user: ApiUser): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const removeUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY)
}

export const getOrCreateDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY)
  if (!deviceId) {
    deviceId =
      'device-' +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
  }
  return deviceId
}

// ============================================================
// Fetch wrapper
// ============================================================

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new ApiError(response.status, errorBody)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export class ApiError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`)
    this.status = status
    this.body = body
  }
}

// ============================================================
// Media upload
// ============================================================

export const apiUploadImage = async (
  uri: string,
  filename: string
): Promise<{ id: string }> => {
  const token = await getStoredToken()
  const formData = new FormData()

  formData.append('file', {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as unknown as Blob)

  const response = await fetch(`${API_URL}/media/images`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new ApiError(response.status, errorBody)
  }

  const data = await response.json()
  return { id: data.id ?? data._id ?? data.gridFsId }
}

// ============================================================
// Media URL builders
// ============================================================

/**
 * Build Authorization headers for authenticated media requests.
 * Use with expo-image source.headers, expo-video, or fetch.
 */
export const getAuthHeaders = (
  token: string | null | undefined
): Record<string, string> => {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const getImageUrl = (mediaId: string): string => {
  return `${API_URL}/media/${mediaId}/stream`
}

export const getVideoStreamUrl = (mediaId: string): string => {
  return `${API_URL}/media/${mediaId}/stream`
}

// ============================================================
// Auth endpoints (legacy — email/password for creators)
// ============================================================

export const apiLogin = async (
  email: string,
  password: string
): Promise<ApiLoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new ApiError(response.status, errorBody)
  }

  return response.json()
}

export const apiGetProfile = (): Promise<ApiProfile> => {
  return apiFetch<ApiProfile>('/me/profile')
}

export const apiGetUserInfo = (): Promise<ApiUser> => {
  return apiFetch<ApiUser>('/user/me', { method: 'POST' })
}

// ============================================================
// Student Auth endpoints (mobile — simplified registration)
// ============================================================

export const apiStudentRegister = async (data: {
  firstName: string
  lastName: string
  phone: string
  dateOfBirth?: string
  deviceId?: string
}): Promise<ApiStudentAuthResponse> => {
  const response = await fetch(`${API_URL}/student/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new ApiError(response.status, errorBody)
  }

  return response.json()
}

export const apiStudentDeviceLogin = async (
  deviceId: string
): Promise<ApiStudentAuthResponse> => {
  const response = await fetch(`${API_URL}/student/auth/device-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new ApiError(response.status, errorBody)
  }

  return response.json()
}

export const apiStudentPhoneLogin = async (
  phone: string
): Promise<ApiStudentAuthResponse> => {
  const response = await fetch(`${API_URL}/student/auth/phone-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '')
    throw new ApiError(response.status, errorBody)
  }

  return response.json()
}

// ============================================================
// Student Profile endpoints
// ============================================================

export const apiGetStudentProfile = (): Promise<ApiStudentProfile> => {
  return apiFetch<ApiStudentProfile>('/student/profile')
}

export const apiUpdateStudentProfile = (data: {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  avatarMediaId?: string | null
}): Promise<ApiStudentProfile> => {
  return apiFetch<ApiStudentProfile>('/student/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const apiDeleteStudentAccount = (): Promise<void> => {
  return apiFetch<void>('/student/account', { method: 'DELETE' })
}

// ============================================================
// Catalog endpoints (public — for mobile course browsing)
// ============================================================

export const apiGetCatalogCourses = (
  params?: Record<string, string>
): Promise<{
  items: ApiCourse[]
  page: number
  limit: number
  total: number
}> => {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<{
    items: ApiCourse[]
    page: number
    limit: number
    total: number
  }>(`/catalog/courses${query}`)
}

export const apiGetCatalogCourseDetail = (
  courseId: string
): Promise<ApiCourse> => {
  return apiFetch<ApiCourse>(`/catalog/courses/${courseId}`)
}

export const apiGetCatalogCategories = (): Promise<{
  categories: string[]
}> => {
  return apiFetch<{ categories: string[] }>('/catalog/categories')
}

// ============================================================
// Legacy Course endpoints (for admin/creator panel — requires USER/ADMIN role)
// ============================================================

export const apiGetCourses = (
  params?: Record<string, string>
): Promise<ApiCourse[]> => {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<ApiCourse[]>(`/courses${query}`)
}

export const apiGetCourse = (courseId: string): Promise<ApiCourse> => {
  return apiFetch<ApiCourse>(`/courses/${courseId}`)
}

// ============================================================
// Enrollment endpoints
// ============================================================

export const apiEnroll = (
  courseId: string
): Promise<{
  id: string
  courseId: string
  status: string
  enrolledAt: string
}> => {
  return apiFetch('/student/enrollments', {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  })
}

export const apiGetEnrollments = (): Promise<{
  enrollments: ApiEnrollment[]
}> => {
  return apiFetch<{ enrollments: ApiEnrollment[] }>('/student/enrollments')
}

export const apiGetEnrollmentDetail = (
  courseId: string
): Promise<ApiEnrollmentDetail> => {
  return apiFetch<ApiEnrollmentDetail>(`/student/enrollments/${courseId}`)
}

export const apiDropEnrollment = (
  courseId: string
): Promise<{ status: string }> => {
  return apiFetch<{ status: string }>(`/student/enrollments/${courseId}`, {
    method: 'DELETE',
  })
}

// ============================================================
// Student Progress endpoints (JWT-based)
// ============================================================

export const apiGetStudentProgressList = (): Promise<{
  progress: ApiCourseProgress[]
}> => {
  return apiFetch<{ progress: ApiCourseProgress[] }>(
    '/student/progress/courses'
  )
}

export const apiGetStudentCourseProgress = (
  courseId: string
): Promise<ApiEnrollmentDetail> => {
  return apiFetch<ApiEnrollmentDetail>(`/student/progress/courses/${courseId}`)
}

export const apiSaveStudentSectionProgress = (
  courseId: string,
  sectionId: string,
  score: number,
  totalQuestions: number
): Promise<{ sectionId: string; completed: boolean; score: number }> => {
  return apiFetch(
    `/student/progress/courses/${courseId}/sections/${sectionId}`,
    {
      method: 'POST',
      body: JSON.stringify({ score, totalQuestions }),
    }
  )
}

export const apiCompleteStudentCourse = (
  courseId: string
): Promise<{
  courseId: string
  completedAt: string
  progressPercent: number
}> => {
  return apiFetch(`/student/progress/courses/${courseId}/complete`, {
    method: 'PUT',
    body: JSON.stringify({}),
  })
}

// ============================================================
// Legacy Progress endpoints (username-based — for web panel)
// ============================================================

export const apiGetUserProgress = (
  username: string
): Promise<ApiCourseProgress[]> => {
  return apiFetch<ApiCourseProgress[]>(`/progress/${username}/courses`)
}

export const apiGetCourseProgress = (
  username: string,
  courseId: string
): Promise<ApiCourseProgress> => {
  return apiFetch<ApiCourseProgress>(
    `/progress/${username}/courses/${courseId}`
  )
}

export const apiSaveSectionProgress = (
  username: string,
  courseId: string,
  sectionId: string
): Promise<ApiSectionProgress> => {
  return apiFetch<ApiSectionProgress>(
    `/progress/${username}/courses/${courseId}/sections/${sectionId}`,
    { method: 'POST' }
  )
}

export const apiMarkCourseCompleted = (
  username: string,
  courseId: string
): Promise<ApiCourseProgress> => {
  return apiFetch<ApiCourseProgress>(
    `/progress/${username}/courses/${courseId}/complete`,
    { method: 'PUT' }
  )
}

// ============================================================
// Student Activity answer submission
// ============================================================

export const apiSubmitAnswer = (
  activityId: string,
  answer: number | boolean
): Promise<ApiAnswerResult> => {
  return apiFetch<ApiAnswerResult>(`/student/activities/${activityId}/answer`, {
    method: 'POST',
    body: JSON.stringify({ answer }),
  })
}

// ============================================================
// Gamification endpoints
// ============================================================

export const apiGetGamificationSummary =
  (): Promise<ApiGamificationSummary> => {
    return apiFetch<ApiGamificationSummary>('/student/gamification/summary')
  }

export const apiGetBadges = (): Promise<{
  badges: ApiGamificationSummary['recentBadges']
}> => {
  return apiFetch('/student/gamification/badges')
}

export const apiGetPointsHistory = (
  page = 1,
  limit = 20
): Promise<{
  items: {
    id: string
    action: string
    points: number
    courseId: string | null
    earnedAt: string
  }[]
  total: number
}> => {
  return apiFetch(
    `/student/gamification/points-history?page=${page}&limit=${limit}`
  )
}

// ============================================================
// Leaderboard endpoints
// ============================================================

export const apiGetGlobalLeaderboard = (
  month?: string
): Promise<ApiLeaderboardResult> => {
  const qs = month ? `?month=${month}` : ''
  return apiFetch<ApiLeaderboardResult>(`/leaderboard/global${qs}`)
}

export const apiGetCourseLeaderboard = (
  courseId: string,
  month?: string
): Promise<ApiLeaderboardResult> => {
  const qs = month ? `?month=${month}` : ''
  return apiFetch<ApiLeaderboardResult>(`/leaderboard/courses/${courseId}${qs}`)
}

// ============================================================
// Reviews endpoints
// ============================================================

export const apiCheckReviewed = (
  courseId: string
): Promise<{ hasReviewed: boolean }> => {
  return apiFetch<{ hasReviewed: boolean }>(
    `/student/reviews/check/${courseId}`
  )
}

export const apiSubmitReview = (data: {
  courseId: string
  rating: number
  tags: string[]
  comment: string | null
}): Promise<{ id: string; rating: number }> => {
  return apiFetch('/student/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const apiGetCourseReviews = (
  courseId: string,
  page = 1
): Promise<{
  items: ApiReviewItem[]
  total: number
  summary: {
    averageRating: number
    totalReviews: number
    distribution: Record<number, number>
  }
}> => {
  return apiFetch(`/catalog/courses/${courseId}/reviews?page=${page}`)
}

// ============================================================
// Student Certificate endpoints
// ============================================================

export const apiGetStudentCertificates = (): Promise<{
  certificates: ApiCertificate[]
}> => {
  return apiFetch<{ certificates: ApiCertificate[] }>('/student/certificates')
}

export const getStudentCertificatePdfUrl = (certId: string): string => {
  return `${API_URL}/student/certificates/${certId}/pdf`
}

export const apiVerifyCertificate = (
  code: string
): Promise<{
  id: string
  userName: string
  courseName: string
  completedAt: string
  verified: boolean
}> => {
  return apiFetch(`/certificates/verify/${code}`)
}

// ============================================================
// Legacy Certificate endpoints (username-based)
// ============================================================

export const apiGetCertificates = (
  username: string
): Promise<ApiCertificate[]> => {
  return apiFetch<ApiCertificate[]>(`/certificates/${username}`)
}

export const apiCreateCertificate = (data: {
  courseId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}): Promise<ApiCertificate> => {
  return apiFetch<ApiCertificate>('/certificates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
