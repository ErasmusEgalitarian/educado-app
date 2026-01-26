import { AppColors } from '@/constants/theme/AppColors'
import { formatLongDate } from '@/utils/formatters'
import { getCertificates } from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useCallback, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface CertificateData {
  courseId: string
  courseName: string
  completedAt: string
  userName: string
  totalSections: number
}

export default function ProfileScreen() {
  const colors = AppColors()
  const router = useRouter()
  const [certificates, setCertificates] = useState<CertificateData[]>([])

  const loadCertificates = useCallback(async () => {
    const certs = await getCertificates()
    setCertificates(certs)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadCertificates()
    }, [loadCertificates])
  )

  const handleViewCertificate = (courseId: string) => {
    router.push(`/(tabs)/courses/${courseId}/certificate`)
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View
            style={[
              styles.profileAvatar,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <View style={styles.profileText}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              Learner
            </Text>
            <Text
              style={[styles.profileSubtitle, { color: colors.textSecondary }]}
            >
              {certificates.length}{' '}
              {certificates.length === 1 ? 'certificate' : 'certificates'}{' '}
              earned
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Certificates Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Your Certificates
          </Text>

          {certificates.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <Ionicons
                name="ribbon-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No certificates yet
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: colors.textSecondary }]}
              >
                Complete courses with a score of 75% or higher to earn
                certificates
              </Text>
            </View>
          ) : (
            <View style={styles.certificatesList}>
              {certificates.map((cert) => (
                <TouchableOpacity
                  key={cert.courseId}
                  style={[
                    styles.certificateCard,
                    { backgroundColor: colors.cardBackground },
                  ]}
                  onPress={() => handleViewCertificate(cert.courseId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.certificateIcon,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons
                      name="trophy"
                      size={32}
                      color={colors.textLight}
                    />
                  </View>

                  <View style={styles.certificateContent}>
                    <Text
                      style={[
                        styles.certificateTitle,
                        { color: colors.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {cert.courseName}
                    </Text>
                    <View style={styles.certificateMeta}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.certificateDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {formatLongDate(cert.completedAt)}
                      </Text>
                    </View>
                    <View style={styles.certificateMeta}>
                      <Ionicons
                        name="book-outline"
                        size={14}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.certificateDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {cert.totalSections} sections
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Stats Section */}
        {certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Your Stats
            </Text>
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Ionicons name="trophy" size={32} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {certificates.length}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Certificates
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={colors.primary}
                />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {certificates.reduce(
                    (sum, cert) => sum + cert.totalSections,
                    0
                  )}
                </Text>
                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Sections Completed
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  certificatesList: {
    gap: 12,
  },
  certificateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  certificateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certificateContent: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  certificateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  certificateDate: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
})
