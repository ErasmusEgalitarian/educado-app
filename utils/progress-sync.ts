import { API_BASE_URL } from './api-config'
import { getDeviceId } from './device-id'
import {
  getCourseProgress,
  saveSectionProgress as saveLocalSectionProgress,
} from './progress-storage'

/**
 * Sync local progress to backend
 */
export async function syncProgressToBackend(
  courseId: string
): Promise<boolean> {
  try {
    const deviceId = await getDeviceId()
    const localProgress = await getCourseProgress(courseId)

    // Sync each completed section
    for (const section of localProgress.sections) {
      if (section.completed) {
        await fetch(
          `${API_BASE_URL}/progress/${deviceId}/courses/${courseId}/sections/${section.sectionId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              score: section.score,
              totalQuestions: section.totalQuestions,
            }),
          }
        )
      }
    }

    // Mark course as completed if locally completed
    if (localProgress.completedAt) {
      await fetch(
        `${API_BASE_URL}/progress/${deviceId}/courses/${courseId}/complete`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      )
    }

    console.log(`✅ Synced progress for course ${courseId} to backend`)
    return true
  } catch (error) {
    console.error('Failed to sync progress to backend:', error)
    return false
  }
}

/**
 * Sync backend progress to local storage
 */
export async function syncProgressFromBackend(
  courseId: string
): Promise<boolean> {
  try {
    const deviceId = await getDeviceId()

    // Fetch progress from backend
    const response = await fetch(
      `${API_BASE_URL}/progress/${deviceId}/courses/${courseId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch backend progress: ${response.statusText}`
      )
    }

    const backendProgress = (await response.json()) as {
      id: string
      courseId: string
      deviceId: string
      startedAt: string
      lastAccessedAt: string
      completedAt: string | null
      sections: Array<{
        id: string
        sectionId: string
        completed: boolean
        score: number
        totalQuestions: number
        completedAt: string | null
      }>
    }

    // Get local progress to compare
    const localProgress = await getCourseProgress(courseId)

    // Merge progress - use latest timestamp for conflicts
    for (const backendSection of backendProgress.sections) {
      const localSection = localProgress.sections.find(
        (s) => s.sectionId === backendSection.sectionId
      )

      // If backend has a completion that's newer than local, update local
      if (
        backendSection.completed &&
        (!localSection ||
          !localSection.completedAt ||
          new Date(backendSection.completedAt!) >
            new Date(localSection.completedAt))
      ) {
        await saveLocalSectionProgress(
          courseId,
          backendSection.sectionId,
          backendSection.score,
          backendSection.totalQuestions
        )
      }
    }

    console.log(`✅ Synced progress for course ${courseId} from backend`)
    return true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // 404 means no backend progress exists yet, which is fine
    if (error.status === 404) {
      console.log(`No backend progress found for course ${courseId}`)
      return true
    }
    console.error('Failed to sync progress from backend:', error)
    return false
  }
}

/**
 * Bidirectional sync - merges local and backend progress
 */
export async function syncProgress(courseId: string): Promise<boolean> {
  try {
    // First, pull from backend to get latest
    await syncProgressFromBackend(courseId)

    // Then, push any local changes to backend
    await syncProgressToBackend(courseId)

    return true
  } catch (error) {
    console.error('Failed to sync progress:', error)
    return false
  }
}

/**
 * Sync all courses progress
 */
export async function syncAllProgress(): Promise<void> {
  try {
    const deviceId = await getDeviceId()

    // Get all backend progress
    const response = await fetch(
      `${API_BASE_URL}/progress/${deviceId}/courses`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch all progress: ${response.statusText}`)
    }

    const allBackendProgress = (await response.json()) as Array<{
      courseId: string
    }>

    // Sync each course
    for (const progress of allBackendProgress) {
      await syncProgress(progress.courseId)
    }

    console.log('✅ Synced all course progress')
  } catch (error) {
    console.error('Failed to sync all progress:', error)
  }
}
