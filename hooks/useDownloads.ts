import {
  downloadCourse,
  deleteCourseDownload,
  getDownloadedCourses,
  getDownloadManifest,
  DownloadManifest,
  DownloadProgress,
} from '@/services/download-manager'
import { t } from '@/i18n/config'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert } from 'react-native'

export function useDownloadCourse() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<DownloadProgress | null>(null)

  const mutation = useMutation({
    mutationFn: (courseId: string) =>
      downloadCourse(courseId, (p) => setProgress(p)),
    onSuccess: (_data, courseId) => {
      Alert.alert(t('certificate.success'), t('downloads.downloadSuccess'))
      queryClient.invalidateQueries({ queryKey: ['downloads'] })
      queryClient.invalidateQueries({
        queryKey: ['download-manifest', courseId],
      })
    },
    onError: () => {
      Alert.alert(t('common.error'), t('downloads.downloadError'))
    },
    onSettled: () => {
      setProgress(null)
    },
  })

  return { ...mutation, progress }
}

export function useDownloadedCourses() {
  return useQuery<DownloadManifest[]>({
    queryKey: ['downloads'],
    queryFn: getDownloadedCourses,
  })
}

export function useIsDownloaded(courseId: string) {
  return useQuery<DownloadManifest | null>({
    queryKey: ['download-manifest', courseId],
    queryFn: () => getDownloadManifest(courseId),
    enabled: !!courseId,
  })
}

export function useDeleteDownload() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (courseId: string) => deleteCourseDownload(courseId),
    onSuccess: (_data, courseId) => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] })
      queryClient.invalidateQueries({
        queryKey: ['download-manifest', courseId],
      })
    },
  })
}
