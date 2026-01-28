/* eslint-disable @typescript-eslint/no-explicit-any */
// Map video URLs to local require statements
const VIDEO_ASSETS: Record<string, any> = {
  'Crypto Bro A.mp4': require('@/assets/videos/Crypto Bro A.mp4'),
  'Desconfiar é se proteger.mp4': require('@/assets/videos/Desconfiar é se proteger.mp4'),
  'Nunca passar senha ou código.mp4': require('@/assets/videos/Nunca passar senha ou código.mp4'),
}

/**
 * Get the video source for a given video URL
 * If it's a local asset (matches one of our video files), returns the required asset
 * Otherwise, returns the URL as-is (for remote videos)
 */
export function getVideoSource(videoUrl: string): any {
  // Check if it's one of our local assets
  if (VIDEO_ASSETS[videoUrl]) {
    return VIDEO_ASSETS[videoUrl]
  }

  // Otherwise, assume it's a remote URL
  return videoUrl
}
