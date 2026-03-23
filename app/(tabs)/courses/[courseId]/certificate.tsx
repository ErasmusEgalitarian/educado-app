import Certificate from '@/components/Certificate/Certificate'
import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCourse } from '@/hooks/useCourses'
import { apiCreateCertificate } from '@/services/api'
import { t } from '@/i18n/config'
import {
  getCertificate,
  getCourseProgress,
  saveCertificate as saveLocalCertificate,
} from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import * as MediaLibrary from 'expo-media-library'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { captureRef } from 'react-native-view-shot'

export default function CertificateScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>()
  const router = useRouter()
  const colors = AppColors()
  const certificateRef = useRef<View>(null)
  const { currentLanguage } = useLanguage()
  const { user } = useAuth()

  const { data: course } = useCourse(courseId)
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Learner'

  const [userName, setUserName] = useState(displayName)
  const [completionDate, setCompletionDate] = useState(new Date().toISOString())
  const [isDownloading, setIsDownloading] = useState(false)

  const loadCertificateData = useCallback(async () => {
    if (!course) return

    const courseProgress = await getCourseProgress(courseId)
    const existingCertificate = await getCertificate(courseId)

    if (existingCertificate) {
      setUserName(existingCertificate.userName)
      setCompletionDate(existingCertificate.completedAt)
    } else if (courseProgress.completedAt) {
      const name = displayName
      const newCertificate = {
        courseId,
        courseName: course.title,
        completedAt: courseProgress.completedAt,
        userName: name,
        totalSections: course.sections.length,
      }
      await saveLocalCertificate(newCertificate)
      setUserName(name)
      setCompletionDate(courseProgress.completedAt)

      try {
        await apiCreateCertificate(newCertificate)
      } catch {
        // Backend may already have it
      }
    }
  }, [course, courseId, displayName])

  useEffect(() => {
    if (course) {
      loadCertificateData()
    }
  }, [course, loadCertificateData])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          t('certificate.permissionRequired'),
          t('certificate.permissionMessage')
        )
        setIsDownloading(false)
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 100))

      if (certificateRef.current) {
        const uri = await captureRef(certificateRef.current, {
          format: 'png',
          quality: 1,
        })

        await MediaLibrary.createAssetAsync(uri)

        Alert.alert(t('certificate.success'), t('certificate.savedSuccess'), [
          { text: t('common.ok') },
        ])
      } else {
        Alert.alert(t('common.error'), t('certificate.saveError'), [
          { text: t('common.ok') },
        ])
      }
    } catch (error) {
      console.error('Error saving certificate:', error)
      Alert.alert(t('common.error'), t('certificate.saveError'), [
        { text: t('common.ok') },
      ])
    } finally {
      setIsDownloading(false)
    }
  }

  const handleBackToCourses = () => {
    router.push('/(tabs)')
  }

  if (!course) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <Text style={{ color: colors.textPrimary }}>
          {t('errors.loadCourse')}
        </Text>
      </View>
    )
  }

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToCourses}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('certificate.headerTitle')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Celebration header */}
        <View style={styles.celebrationHeader}>
          <View
            style={[
              styles.celebrationBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="trophy" size={64} color={colors.textLight} />
          </View>
          <Text style={[styles.celebrationTitle, { color: colors.primary }]}>
            {t('certificate.congratulations')}
          </Text>
          <Text
            style={[
              styles.celebrationSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {t('certificate.completedSubtitle')}
          </Text>
        </View>

        {/* Certificate */}
        <View
          style={styles.certificateContainer}
          ref={certificateRef}
          collapsable={false}
        >
          <Certificate
            courseName={course.title}
            completionDate={completionDate}
            userName={userName}
            totalSections={course.sections.length}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <ButtonPrimary
            title={t('certificate.download')}
            onPress={handleDownload}
            icon="download"
            fullWidth
            loading={isDownloading}
            variant="primary"
          />

          <View style={styles.actionSpacing} />

          <ButtonPrimary
            title={t('certificate.backToCourses')}
            onPress={handleBackToCourses}
            icon="home"
            fullWidth
            variant="tertiary"
          />
        </View>

        {/* Encouragement message */}
        <View
          style={[
            styles.messageBox,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <Ionicons name="sparkles" size={24} color={colors.primary} />
          <Text style={[styles.messageText, { color: colors.textSecondary }]}>
            {t('certificate.keepLearning')}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 44,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  celebrationHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  celebrationBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  celebrationSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  certificateContainer: {
    marginBottom: 32,
  },
  actions: {
    marginBottom: 24,
  },
  actionSpacing: {
    height: 12,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
})
