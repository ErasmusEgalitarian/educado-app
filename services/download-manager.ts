import { API_BASE_URL } from '@/utils/api-config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'
import {
  ApiCourse,
  apiGetCatalogCourseDetail,
  getStoredToken,
} from './api'

const DOWNLOADS_KEY = '@educado:downloads'
const OFFLINE_COURSE_PREFIX = '@educado:offline-course:'
const DOWNLOADS_DIR = `${FileSystem.documentDirectory}downloads/`

// ============================================================
// Types
// ============================================================

export interface DownloadFileEntry {
  mediaId: string
  localUri: string
  type: 'video' | 'image'
}

export interface DownloadManifest {
  courseId: string
  courseTitle: string
  downloadedAt: string
  status: 'downloading' | 'complete' | 'error'
  files: DownloadFileEntry[]
  totalSections: number
}

export type DownloadProgress = {
  downloadedFiles: number
  totalFiles: number
  currentFile: string
}

// ============================================================
// Manifest management
// ============================================================

async function getAllManifests(): Promise<Record<string, DownloadManifest>> {
  const data = await AsyncStorage.getItem(DOWNLOADS_KEY)
  return data ? JSON.parse(data) : {}
}

async function saveManifest(courseId: string, manifest: DownloadManifest) {
  const all = await getAllManifests()
  all[courseId] = manifest
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(all))
}

async function removeManifest(courseId: string) {
  const all = await getAllManifests()
  delete all[courseId]
  await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(all))
}

// ============================================================
// File download helpers
// ============================================================

function getMediaUrl(mediaId: string): string {
  return `${API_BASE_URL}/media/${mediaId}/stream`
}

function getLocalPath(courseId: string, mediaId: string, ext: string): string {
  return `${DOWNLOADS_DIR}${courseId}/${mediaId}.${ext}`
}

async function ensureDir(path: string) {
  const info = await FileSystem.getInfoAsync(path)
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true })
  }
}

async function downloadFile(
  url: string,
  localUri: string,
  headers?: Record<string, string>
): Promise<boolean> {
  try {
    const result = await FileSystem.downloadAsync(url, localUri, { headers })
    return result.status === 200
  } catch {
    return false
  }
}

// ============================================================
// Public API
// ============================================================

export async function downloadCourse(
  courseId: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  const token = await getStoredToken()
  if (!token) throw new Error('NO_TOKEN')

  // Fetch full course data from API
  const course = await apiGetCatalogCourseDetail(courseId)

  // Store course JSON for offline use
  await AsyncStorage.setItem(
    `${OFFLINE_COURSE_PREFIX}${courseId}`,
    JSON.stringify(course)
  )

  // Build list of media to download
  const mediaToDownload: { mediaId: string; type: 'video' | 'image'; ext: string }[] = []

  if (course.imageMediaId) {
    mediaToDownload.push({ mediaId: course.imageMediaId, type: 'image', ext: 'jpg' })
  }

  for (const section of course.sections ?? []) {
    if (section.videoMediaId) {
      mediaToDownload.push({ mediaId: section.videoMediaId, type: 'video', ext: 'mp4' })
    }
    if (section.thumbnailMediaId) {
      mediaToDownload.push({ mediaId: section.thumbnailMediaId, type: 'image', ext: 'jpg' })
    }
  }

  // Initialize manifest
  const manifest: DownloadManifest = {
    courseId,
    courseTitle: course.title,
    downloadedAt: new Date().toISOString(),
    status: 'downloading',
    files: [],
    totalSections: (course.sections ?? []).length,
  }
  await saveManifest(courseId, manifest)

  // Ensure download directory
  await ensureDir(`${DOWNLOADS_DIR}${courseId}`)

  // Download files sequentially
  for (let i = 0; i < mediaToDownload.length; i++) {
    const { mediaId, type, ext } = mediaToDownload[i]
    const localUri = getLocalPath(courseId, mediaId, ext)

    onProgress?.({
      downloadedFiles: i,
      totalFiles: mediaToDownload.length,
      currentFile: mediaId,
    })

    const url = getMediaUrl(mediaId)
    const authHeaders = { Authorization: `Bearer ${token}` }
    const success = await downloadFile(url, localUri, authHeaders)

    if (success) {
      manifest.files.push({ mediaId, localUri, type })
    }
  }

  // Finalize
  manifest.status = 'complete'
  await saveManifest(courseId, manifest)

  onProgress?.({
    downloadedFiles: mediaToDownload.length,
    totalFiles: mediaToDownload.length,
    currentFile: '',
  })
}

export async function deleteCourseDownload(courseId: string): Promise<void> {
  const dir = `${DOWNLOADS_DIR}${courseId}/`
  const info = await FileSystem.getInfoAsync(dir)
  if (info.exists) {
    await FileSystem.deleteAsync(dir, { idempotent: true })
  }
  await AsyncStorage.removeItem(`${OFFLINE_COURSE_PREFIX}${courseId}`)
  await removeManifest(courseId)
}

export async function getDownloadedCourses(): Promise<DownloadManifest[]> {
  const all = await getAllManifests()
  return Object.values(all).filter((m) => m.status === 'complete')
}

export async function isDownloaded(courseId: string): Promise<boolean> {
  const all = await getAllManifests()
  return all[courseId]?.status === 'complete'
}

export async function getDownloadManifest(
  courseId: string
): Promise<DownloadManifest | null> {
  const all = await getAllManifests()
  return all[courseId] ?? null
}

export async function getOfflineCourse(
  courseId: string
): Promise<ApiCourse | null> {
  const data = await AsyncStorage.getItem(`${OFFLINE_COURSE_PREFIX}${courseId}`)
  return data ? JSON.parse(data) : null
}

export function getLocalMediaUri(
  courseId: string,
  mediaId: string,
  type: 'video' | 'image'
): string {
  const ext = type === 'video' ? 'mp4' : 'jpg'
  return getLocalPath(courseId, mediaId, ext)
}

export async function deleteAllDownloads(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOADS_DIR)
  if (info.exists) {
    await FileSystem.deleteAsync(DOWNLOADS_DIR, { idempotent: true })
  }
  // Clear all offline course keys
  const keys = await AsyncStorage.getAllKeys()
  const offlineKeys = keys.filter((k) => k.startsWith(OFFLINE_COURSE_PREFIX))
  if (offlineKeys.length > 0) {
    await AsyncStorage.multiRemove(offlineKeys)
  }
  await AsyncStorage.removeItem(DOWNLOADS_KEY)
}
