/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Helper functions to load images - supports both local and API URLs
 */

// Map of course image URLs to their require() paths (fallbacks for local assets)
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

const fallbackImage = require('@/assets/images/logo_black240.png')

/**
 * Get course image source - handles both API URLs and local asset keys
 */
export const getCourseImage = (imageUrl: string) => {
  if (imageUrl.startsWith('http')) {
    return { uri: imageUrl }
  }
  return courseImages[imageUrl] || fallbackImage
}

/**
 * Get section thumbnail source - handles both API URLs and local asset keys
 */
export const getSectionThumbnail = (thumbnailUrl: string) => {
  if (thumbnailUrl.startsWith('http')) {
    return { uri: thumbnailUrl }
  }
  return sectionThumbnails[thumbnailUrl] || fallbackImage
}

/**
 * General image loader for both courses and sections
 * @param imageUrl The image identifier
 * @returns Image source for expo-image or fallback logo
 */
export const imageLoader = (imageUrl: string) => {
  return (
    courseImages[imageUrl] ||
    sectionThumbnails[imageUrl] ||
    require('@/assets/images/logo_black240.png')
  )
}
