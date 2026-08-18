import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCertificates } from '@/hooks/useCertificates'
import { t } from '@/i18n/config'
import { formatDate } from '@/utils/formatters'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function CertificatesScreen() {
  const colors = AppColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { currentLanguage } = useLanguage()

  const { data: certificates = [], isLoading, refetch } = useCertificates()

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View
      key={currentLanguage}
      style={[
        styles.container,
        { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('profile.certificates')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {certificates.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Ionicons
              name="ribbon-outline"
              size={80}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.emptyStateText, { color: colors.textPrimary }]}
            >
              {t('profile.noCertificates')}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.countText, { color: colors.textSecondary }]}>
              {t('profile.certificatesEarned', { count: certificates.length })}
            </Text>

            {certificates.map((cert) => (
              <TouchableOpacity
                key={cert.id}
                style={[
                  styles.certificateCard,
                  { backgroundColor: colors.cardBackground },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  router.push(`/(tabs)/courses/${cert.courseId}/certificate`)
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.certBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="trophy" size={28} color="#FFFFFF" />
                </View>

                <View style={styles.certInfo}>
                  <Text
                    style={[
                      styles.certCourseName,
                      { color: colors.textPrimary },
                    ]}
                    numberOfLines={2}
                  >
                    {cert.courseName}
                  </Text>
                  <Text
                    style={[styles.certDate, { color: colors.textSecondary }]}
                  >
                    {t('profile.completedAt', {
                      date: formatDate(cert.completedAt),
                    })}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  countText: {
    fontSize: 15,
    marginBottom: 16,
  },
  emptyStateCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  certificateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  certBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  certInfo: {
    flex: 1,
  },
  certCourseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  certDate: {
    fontSize: 13,
  },
})
