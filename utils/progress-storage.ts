import AsyncStorage from '@react-native-async-storage/async-storage'

// Storage keys
const PROGRESS_KEY_PREFIX = 'course_progress_'
const CERTIFICATES_KEY = 'user_certificates'

// Types
export interface SectionProgress {
  sectionId: string
  completed: boolean
  score: number
  totalQuestions: number
  completedAt?: string
}

export interface CourseProgress {
  courseId: string
  sections: SectionProgress[]
  startedAt: string
  lastAccessedAt: string
  completedAt?: string
}

export interface Certificate {
  courseId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}

// Helper to get storage key for a course
const getCourseProgressKey = (courseId: string): string => {
  return `${PROGRESS_KEY_PREFIX}${courseId}`
}

/**
 * Save progress for a specific section
 */
export const saveSectionProgress = async (
  courseId: string,
  sectionId: string,
  score: number,
  totalQuestions: number
): Promise<void> => {
  try {
    const progress = await getCourseProgress(courseId)
    const now = new Date().toISOString()

    // Find existing section progress or create new
    const existingSectionIndex = progress.sections.findIndex(
      (s) => s.sectionId === sectionId
    )

    const sectionProgress: SectionProgress = {
      sectionId,
      completed: true,
      score,
      totalQuestions,
      completedAt: now,
    }

    if (existingSectionIndex >= 0) {
      progress.sections[existingSectionIndex] = sectionProgress
    } else {
      progress.sections.push(sectionProgress)
    }

    progress.lastAccessedAt = now

    await AsyncStorage.setItem(
      getCourseProgressKey(courseId),
      JSON.stringify(progress)
    )
  } catch (error) {
    console.error('Error saving section progress:', error)
    throw error
  }
}

/**
 * Get progress for a specific course
 */
export const getCourseProgress = async (
  courseId: string
): Promise<CourseProgress> => {
  try {
    const data = await AsyncStorage.getItem(getCourseProgressKey(courseId))

    if (data) {
      return JSON.parse(data)
    }

    // Return default progress if none exists
    const now = new Date().toISOString()
    return {
      courseId,
      sections: [],
      startedAt: now,
      lastAccessedAt: now,
    }
  } catch (error) {
    console.error('Error getting course progress:', error)
    throw error
  }
}

/**
 * Check if a section is completed
 */
export const isSectionCompleted = async (
  courseId: string,
  sectionId: string
): Promise<boolean> => {
  try {
    const progress = await getCourseProgress(courseId)
    const section = progress.sections.find((s) => s.sectionId === sectionId)
    return section?.completed || false
  } catch (error) {
    console.error('Error checking section completion:', error)
    return false
  }
}

/**
 * Check if entire course is completed
 */
export const isCourseCompleted = async (
  courseId: string,
  totalSections: number
): Promise<boolean> => {
  try {
    const progress = await getCourseProgress(courseId)
    const completedSections = progress.sections.filter(
      (s) => s.completed
    ).length
    return completedSections === totalSections
  } catch (error) {
    console.error('Error checking course completion:', error)
    return false
  }
}

/**
 * Mark course as completed and save completion date
 */
export const markCourseCompleted = async (courseId: string): Promise<void> => {
  try {
    const progress = await getCourseProgress(courseId)
    progress.completedAt = new Date().toISOString()
    await AsyncStorage.setItem(
      getCourseProgressKey(courseId),
      JSON.stringify(progress)
    )
  } catch (error) {
    console.error('Error marking course completed:', error)
    throw error
  }
}

/**
 * Get course completion percentage (sections completed)
 */
export const getCourseCompletionPercentage = async (
  courseId: string,
  totalSections: number
): Promise<number> => {
  try {
    const progress = await getCourseProgress(courseId)
    const completedSections = progress.sections.filter(
      (s) => s.completed
    ).length
    return totalSections > 0
      ? Math.round((completedSections / totalSections) * 100)
      : 0
  } catch (error) {
    console.error('Error getting completion percentage:', error)
    return 0
  }
}

/**
 * Get course score percentage (average score across all completed sections)
 */
export const getCourseScorePercentage = async (
  courseId: string
): Promise<number> => {
  try {
    const progress = await getCourseProgress(courseId)
    const completedSections = progress.sections.filter((s) => s.completed)

    if (completedSections.length === 0) {
      return 0
    }

    const totalScore = completedSections.reduce((sum, section) => {
      const sectionPercentage =
        section.totalQuestions > 0
          ? (section.score / section.totalQuestions) * 100
          : 0
      return sum + sectionPercentage
    }, 0)

    return Math.round(totalScore / completedSections.length)
  } catch (error) {
    console.error('Error getting course score percentage:', error)
    return 0
  }
}

/**
 * Check if user has passed the course based on score threshold
 */
export const hasPassedCourse = async (
  courseId: string,
  totalSections: number,
  passingThreshold: number
): Promise<boolean> => {
  try {
    // First check if all sections are completed
    const isCompleted = await isCourseCompleted(courseId, totalSections)
    if (!isCompleted) {
      return false
    }

    // Then check if score meets threshold
    const score = await getCourseScorePercentage(courseId)
    return score >= passingThreshold
  } catch (error) {
    console.error('Error checking if passed course:', error)
    return false
  }
}

/**
 * Get the first incomplete section ID
 */
export const getFirstIncompleteSectionId = async (
  courseId: string,
  allSectionIds: string[]
): Promise<string> => {
  try {
    const progress = await getCourseProgress(courseId)

    for (const sectionId of allSectionIds) {
      const isCompleted = progress.sections.find(
        (s) => s.sectionId === sectionId && s.completed
      )
      if (!isCompleted) {
        return sectionId
      }
    }

    // If all completed, return first section
    return allSectionIds[0]
  } catch (error) {
    console.error('Error getting first incomplete section:', error)
    return allSectionIds[0]
  }
}

/**
 * Save a certificate for a completed course
 */
export const saveCertificate = async (
  certificate: Certificate
): Promise<void> => {
  try {
    const certificates = await getCertificates()

    // Check if certificate already exists
    const existingIndex = certificates.findIndex(
      (c) => c.courseId === certificate.courseId
    )

    if (existingIndex >= 0) {
      certificates[existingIndex] = certificate
    } else {
      certificates.push(certificate)
    }

    await AsyncStorage.setItem(CERTIFICATES_KEY, JSON.stringify(certificates))
  } catch (error) {
    console.error('Error saving certificate:', error)
    throw error
  }
}

/**
 * Get all certificates
 */
export const getCertificates = async (): Promise<Certificate[]> => {
  try {
    const data = await AsyncStorage.getItem(CERTIFICATES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error getting certificates:', error)
    return []
  }
}

/**
 * Get certificate for a specific course
 */
export const getCertificate = async (
  courseId: string
): Promise<Certificate | null> => {
  try {
    const certificates = await getCertificates()
    return certificates.find((c) => c.courseId === courseId) || null
  } catch (error) {
    console.error('Error getting certificate:', error)
    return null
  }
}

/**
 * Check if user has certificate for a course
 */
export const hasCertificate = async (courseId: string): Promise<boolean> => {
  try {
    const certificate = await getCertificate(courseId)
    return certificate !== null
  } catch (error) {
    console.error('Error checking certificate:', error)
    return false
  }
}

/**
 * Clear all progress (useful for testing)
 */
export const clearAllProgress = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const progressKeys = keys.filter((key) =>
      key.startsWith(PROGRESS_KEY_PREFIX)
    )
    await AsyncStorage.multiRemove([...progressKeys, CERTIFICATES_KEY])
  } catch (error) {
    console.error('Error clearing progress:', error)
    throw error
  }
}
