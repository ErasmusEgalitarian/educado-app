import { API_BASE_URL } from './api-config'
import {
  Certificate,
  getCertificates,
  getCourseProgress,
  saveCertificate as saveLocalCertificate,
  saveSectionProgress as saveLocalSectionProgress,
} from './progress-storage'
import { getUsername } from './user-storage'

/**
 * Sync local progress to backend
 */
export async function syncProgressToBackend(
  courseId: string
): Promise<boolean> {
  try {
    const username = await getUsername()
    if (!username) {
      console.warn('No username found, skipping sync')
      return false
    }

    const localProgress = await getCourseProgress(courseId)

    // Sync each completed section
    for (const section of localProgress.sections) {
      if (section.completed) {
        await fetch(
          `${API_BASE_URL}/progress/${username}/courses/${courseId}/sections/${section.sectionId}`,
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
        `${API_BASE_URL}/progress/${username}/courses/${courseId}/complete`,
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
    const username = await getUsername()
    if (!username) {
      console.warn('No username found, skipping sync')
      return false
    }

    // Fetch progress from backend
    const response = await fetch(
      `${API_BASE_URL}/progress/${username}/courses/${courseId}`,
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
      userId: string
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
 * Sync local certificates to backend
 */
export async function syncCertificatesToBackend(): Promise<boolean> {
  try {
    const username = await getUsername()
    if (!username) {
      console.warn('No username found, skipping certificate sync')
      return false
    }

    const certificates = await getCertificates()

    if (certificates.length === 0) {
      console.log('No local certificates to sync')
      return true
    }

    console.log(`Syncing ${certificates.length} certificates to backend`)

    for (const cert of certificates) {
      try {
        const body = {
          courseId: cert.courseId,
          username,
          courseName: cert.courseName,
          userName: cert.userName,
          totalSections: cert.totalSections,
        }

        console.log(`Syncing certificate for course ${cert.courseId}`)

        const response = await fetch(`${API_BASE_URL}/certificates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (response.ok) {
          console.log(`✅ Synced certificate for course ${cert.courseId}`)
        } else if (response.status === 409) {
          console.log(
            `Certificate for course ${cert.courseId} already exists on backend`
          )
        } else {
          const errorText = await response.text()
          console.error(
            `Failed to sync certificate for course ${cert.courseId}: ${response.status} ${response.statusText} - ${errorText}`
          )
        }
      } catch (err) {
        console.error(
          `Error syncing certificate for course ${cert.courseId}:`,
          err
        )
      }
    }

    return true
  } catch (error) {
    console.error('Failed to sync certificates to backend:', error)
    return false
  }
}

/**
 * Sync backend certificates to local storage
 */
export async function syncCertificatesFromBackend(): Promise<boolean> {
  try {
    const username = await getUsername()
    if (!username) {
      console.warn('No username found, skipping certificate sync')
      return false
    }

    console.log(`Fetching certificates from backend for user: ${username}`)

    const response = await fetch(`${API_BASE_URL}/certificates/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.log('No backend certificates found (new user)')
        return true // No certificates yet
      }
      const errorText = await response.text()
      throw new Error(
        `Failed to fetch certificates: ${response.statusText} - ${errorText}`
      )
    }

    const backendCertificates = (await response.json()) as Array<{
      courseId: string
      courseName: string
      completedAt: string
      userName: string
      totalSections: number
    }>

    console.log(`Found ${backendCertificates.length} certificates from backend`)

    for (const cert of backendCertificates) {
      const localCert: Certificate = {
        courseId: cert.courseId,
        courseName: cert.courseName,
        completedAt: cert.completedAt,
        userName: cert.userName,
        totalSections: cert.totalSections,
      }
      await saveLocalCertificate(localCert)
    }

    console.log('✅ Synced certificates from backend')
    return true
  } catch (error) {
    console.error('Failed to sync certificates from backend:', error)
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
    const username = await getUsername()
    if (!username) {
      console.warn('No username found, skipping sync')
      return
    }

    console.log(`Starting sync for user: ${username}`)

    // Get all backend progress
    const response = await fetch(
      `${API_BASE_URL}/progress/${username}/courses`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend response error:', errorText)

      // If 404, user has no progress yet - that's okay
      if (response.status === 404) {
        console.log('No backend progress found (new user)')
      } else {
        throw new Error(
          `Failed to fetch all progress: ${response.statusText} - ${errorText}`
        )
      }
    } else {
      const allBackendProgress = (await response.json()) as Array<{
        courseId: string
      }>

      console.log(`Found ${allBackendProgress.length} courses to sync`)

      // Sync each course
      for (const progress of allBackendProgress) {
        await syncProgress(progress.courseId)
      }
    }

    // Sync certificates (always try, even if no progress)
    await syncCertificatesToBackend()
    await syncCertificatesFromBackend()

    console.log('✅ Synced all course progress and certificates')
  } catch (error) {
    console.error('Failed to sync all progress:', error)
  }
}
