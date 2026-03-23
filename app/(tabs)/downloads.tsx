import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDownloadedCourses, useDeleteDownload } from '@/hooks/useDownloads'
import { t } from '@/i18n/config'
import { formatDate } from '@/utils/formatters'
import { DownloadManifest } from '@/services/download-manager'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DownloadsScreen() {
  const colors = AppColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { currentLanguage } = useLanguage()

  const { data: downloads = [], isLoading, refetch } = useDownloadedCourses()
  const deleteMutation = useDeleteDownload()

  useFocusEffect(useCallback(() => { refetch() }, [refetch]))

  const handleDelete = (manifest: DownloadManifest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      t('downloads.deleteConfirmTitle'),
      t('downloads.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('downloads.deleteDownload'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(manifest.courseId),
        },
      ]
    )
  }

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('downloads.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : downloads.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="cloud-download-outline" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
              {t('downloads.noDownloads')}
            </Text>
          </View>
        ) : (
          downloads.map((dl) => (
            <View
              key={dl.courseId}
              style={[styles.card, { backgroundColor: colors.cardBackground }]}
            >
              <View style={styles.cardContent}>
                <Ionicons name="cloud-done" size={28} color={colors.primary} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {dl.courseTitle}
                  </Text>
                  <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                    {t('downloads.sections', { count: dl.totalSections })} — {formatDate(dl.downloadedAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    router.push(`/(tabs)/courses/${dl.courseId}`)
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play" size={16} color="#FFF" />
                  <Text style={styles.actionBtnText}>{t('explore.viewCourse')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(dl)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24 },
  emptyCard: {
    borderRadius: 16, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB', gap: 16,
  },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardMeta: { fontSize: 13 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  deleteBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
})
