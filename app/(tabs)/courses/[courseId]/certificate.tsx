import Certificate from '@/components/Certificate/Certificate'
import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { getCourseById } from '@/data/mock-data'
import { t } from '@/i18n/config'
import {
  getCertificate,
  getCourseProgress,
  hasPassedCourse,
  saveCertificate,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currentLanguage } = useLanguage()

  const course = getCourseById(courseId)
  const [userName, setUserName] = useState('Learner')
  const [completionDate, setCompletionDate] = useState(new Date().toISOString())
  const [isDownloading, setIsDownloading] = useState(false)

  const loadCertificateData = useCallback(async () => {
    if (!course) return

    // Check if user has actually passed
    const passed = await hasPassedCourse(
      courseId,
      course.sections.length,
      course.passingThreshold
    )

    if (!passed) {
      // User hasn't passed, redirect back to course
      Alert.alert(
        'Certificate Not Available',
        `You need to score at least ${course.passingThreshold}% to earn a certificate.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/(tabs)/courses/${courseId}`),
          },
        ]
      )
      return
    }

    const courseProgress = await getCourseProgress(courseId)
    const existingCertificate = await getCertificate(courseId)

    if (existingCertificate) {
      setUserName(existingCertificate.userName)
      setCompletionDate(existingCertificate.completedAt)
    } else if (courseProgress.completedAt) {
      // Create new certificate
      const newCertificate = {
        courseId,
        courseName: course!.title,
        completedAt: courseProgress.completedAt,
        userName: 'Learner',
        totalSections: course!.sections.length,
      }
      await saveCertificate(newCertificate)
      setCompletionDate(courseProgress.completedAt)
    }
  }, [course, courseId, router])

  useEffect(() => {
    if (course) {
      loadCertificateData()
    }
  }, [course, loadCertificateData])

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to save the certificate.'
        )
        setIsDownloading(false)
        return
      }

      // Wait a moment to ensure view is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Capture the certificate as image
      if (certificateRef.current) {
        const uri = await captureRef(certificateRef.current, {
          format: 'png',
          quality: 1,
        })

        // Save to media library
        await MediaLibrary.createAssetAsync(uri)

        Alert.alert('Success!', 'Certificate saved to your photo gallery.', [
          { text: 'OK' },
        ])
      } else {
        Alert.alert('Error', 'Certificate view not ready. Please try again.', [
          { text: 'OK' },
        ])
      }
    } catch (error) {
      console.error('Error saving certificate:', error)
      Alert.alert('Error', 'Failed to save certificate. Please try again.', [
        { text: 'OK' },
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
          Your Certificate
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
            Congratulations!
          </Text>
          <Text
            style={[
              styles.celebrationSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            You've successfully completed the course
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
            title="Download Certificate"
            onPress={handleDownload}
            icon="download"
            fullWidth
            loading={isDownloading}
            variant="primary"
          />

          <View style={styles.actionSpacing} />

          <ButtonPrimary
            title="Back to Courses"
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
            Keep learning! Check out more courses to continue your educational
            journey.
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
