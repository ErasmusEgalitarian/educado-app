/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Helper functions to load local images dynamically
 */

// Map of course image URLs to their require() paths
const courseImages: Record<string, any> = {
  'course-waste-sorting': require('@/assets/images/course-waste-sorting.png'),
  'course-recycling-safety': require('@/assets/images/course-recycling-safety.png'),
  'course-material-identification': require('@/assets/images/course-material-identification.png'),
}

// Map of section thumbnail URLs to their require() paths
const sectionThumbnails: Record<string, any> = {
  'section-1-1': require('@/assets/images/section-1-1.png'),
  'section-1-2': require('@/assets/images/section-1-2.png'),
}

/**
 * Get course image source
 * @param imageUrl The course image identifier
 * @returns Image source for expo-image or fallback logo
 */
export const getCourseImage = (imageUrl: string) => {
  return courseImages[imageUrl] || require('@/assets/images/logo_black240.png')
}

/**
 * Get section thumbnail source
 * @param thumbnailUrl The section thumbnail identifier
 * @returns Image source for expo-image or fallback logo
 */
export const getSectionThumbnail = (thumbnailUrl: string) => {
  return (
    sectionThumbnails[thumbnailUrl] ||
    require('@/assets/images/logo_black240.png')
  )
}
