import AsyncStorage from '@react-native-async-storage/async-storage'

const ENROLLMENT_KEY = 'enrolled_courses'

/**
 * Get all enrolled course IDs
 */
export const getEnrolledCourses = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(ENROLLMENT_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error getting enrolled courses:', error)
    return []
  }
}

/**
 * Enroll in a course
 */
export const enrollInCourse = async (courseId: string): Promise<void> => {
  try {
    const enrolled = await getEnrolledCourses()
    if (!enrolled.includes(courseId)) {
      enrolled.push(courseId)
      await AsyncStorage.setItem(ENROLLMENT_KEY, JSON.stringify(enrolled))
    }
  } catch (error) {
    console.error('Error enrolling in course:', error)
    throw error
  }
}

/**
 * Unenroll from a course
 */
export const unenrollFromCourse = async (courseId: string): Promise<void> => {
  try {
    const enrolled = await getEnrolledCourses()
    const filtered = enrolled.filter((id) => id !== courseId)
    await AsyncStorage.setItem(ENROLLMENT_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error unenrolling from course:', error)
    throw error
  }
}

/**
 * Check if user is enrolled in a course
 */
export const isEnrolledInCourse = async (
  courseId: string
): Promise<boolean> => {
  try {
    const enrolled = await getEnrolledCourses()
    return enrolled.includes(courseId)
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return false
  }
}
