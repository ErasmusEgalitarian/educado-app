import { AppColors } from '@/constants/theme/AppColors'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

interface TextReadingCardProps {
  textPages: string[]
  courseTitle: string
  sectionTitle: string
  onComplete: () => void
  onExit: () => void
}

const TextReadingCard: React.FC<TextReadingCardProps> = ({
  textPages,
  courseTitle,
  sectionTitle,
  onComplete,
  onExit,
}) => {
  const colors = AppColors()
  const [currentPage, setCurrentPage] = useState(0)
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([0]))

  const allPagesViewed = viewedPages.size === textPages.length

  const goToPage = (nextPage: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCurrentPage(nextPage)
    setViewedPages((prev) => new Set([...prev, nextPage]))
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={[styles.card, { backgroundColor: colors.primaryLight }]}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.courseTitle}>
            {t('section.courseName', { name: courseTitle })}
          </Text>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>

        <Text style={styles.bodyText}>{textPages[currentPage]}</Text>

        <Text style={styles.pageCounter}>
          {currentPage + 1}/{textPages.length}
        </Text>
      </ScrollView>

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentPage === 0 && styles.navButtonDisabled,
            { backgroundColor: currentPage === 0 ? '#C1CFD7' : '#EBF0F2' },
          ]}
          activeOpacity={0.75}
          disabled={currentPage === 0}
          onPress={() => goToPage(currentPage - 1)}
        >
          <Ionicons name="chevron-back" size={28} color="#4E6879" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: '#EBF0F2' }]}
          activeOpacity={0.75}
          disabled={currentPage === textPages.length - 1}
          onPress={() => {
            if (currentPage < textPages.length - 1) {
              goToPage(currentPage + 1)
            }
          }}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={currentPage === textPages.length - 1 ? '#9FB4C1' : '#4E6879'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: allPagesViewed ? colors.primary : '#C1CFD7' },
          ]}
          activeOpacity={0.82}
          disabled={!allPagesViewed}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            onComplete()
          }}
        >
          <Text
            style={[
              styles.primaryButtonText,
              { color: allPagesViewed ? '#FDFEFF' : '#809CAD' },
            ]}
          >
            {t('section.completeAndContinue')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.74} onPress={onExit}>
          <Text style={styles.exitText}>{t('section.exitActivity')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#28363E',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingVertical: 36,
  },
  cardHeader: {
    marginBottom: 24,
  },
  courseTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    color: '#28363E',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#141B1F',
  },
  bodyText: {
    fontSize: 18,
    lineHeight: 32,
    fontWeight: '400',
    color: '#000000',
  },
  pageCounter: {
    marginTop: 24,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#000000',
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 100,
    marginTop: 36,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#B3B3B3',
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  navButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  footer: {
    alignItems: 'center',
    gap: 36,
    marginTop: 36,
  },
  primaryButton: {
    width: '100%',
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '700',
  },
  exitText: {
    alignSelf: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#D62B25',
    textDecorationLine: 'underline',
  },
})

export default TextReadingCard
