import { AppColors } from '@/constants/theme/AppColors'
import { t } from '@/i18n/config'
import { formatLongDate } from '@/utils/formatters'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface CertificateProps {
  courseName: string
  completionDate: string
  userName: string
  totalSections: number
}

const Certificate: React.FC<CertificateProps> = ({
  courseName,
  completionDate,
  userName,
  totalSections,
}) => {
  const colors = AppColors()

  return (
    <View
      style={[styles.certificate, { backgroundColor: colors.cardBackground }]}
    >
      {/* Decorative corners */}
      <View
        style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]}
      />
      <View
        style={[
          styles.corner,
          styles.topRight,
          { borderColor: colors.primary },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.bottomLeft,
          { borderColor: colors.primary },
        ]}
      />
      <View
        style={[
          styles.corner,
          styles.bottomRight,
          { borderColor: colors.primary },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Ionicons name="trophy" size={48} color={colors.textLight} />
        </View>

        {/* Title */}
        <Text style={[styles.certificateTitle, { color: colors.primary }]}>
          {t('certificate.title')}
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('certificate.certifies')}
        </Text>

        {/* User name */}
        <Text style={[styles.userName, { color: colors.primaryDark }]}>
          {userName}
        </Text>

        {/* Achievement text */}
        <Text style={[styles.achievementText, { color: colors.textSecondary }]}>
          {t('certificate.completed')}
        </Text>

        {/* Course name */}
        <Text style={[styles.courseName, { color: colors.primary }]}>
          {courseName}
        </Text>

        {/* Course details */}
        <View style={styles.detailsContainer}>
          <View
            style={[
              styles.detailItem,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="book-outline" size={20} color={colors.primary} />
            <Text style={[styles.detailText, { color: colors.primaryDark }]}>
              {totalSections} {t('common.sections')} {t('common.completed')}
            </Text>
          </View>
        </View>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {t('certificate.date')}: {formatLongDate(completionDate)}
        </Text>

        {/* Signature line */}
        <View
          style={[styles.signatureLine, { borderTopColor: colors.primary }]}
        >
          <Text style={[styles.signatureText, { color: colors.primaryDark }]}>
            Educado Learning Platform
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  certificate: {
    width: '100%',
    aspectRatio: 0.7,
    padding: 32,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 16,
    right: 16,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  achievementText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  courseName: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    marginBottom: 24,
  },
  signatureLine: {
    borderTopWidth: 1,
    paddingTop: 12,
    width: '80%',
  },
  signatureText: {
    fontSize: 12,
    textAlign: 'center',
  },
})

export default Certificate
