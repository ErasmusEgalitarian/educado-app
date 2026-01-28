import { AppColors } from '@/constants/theme/AppColors'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import ButtonPrimary from '../Common/ButtonPrimary'

interface TextReadingCardProps {
  textPages: string[]
  courseTitle: string
  sectionTitle: string
  onComplete: () => void
}

const TextReadingCard: React.FC<TextReadingCardProps> = ({
  textPages,
  courseTitle,
  sectionTitle,
  onComplete,
}) => {
  const colors = AppColors()
  const [currentPage, setCurrentPage] = useState(0)
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([0]))

  const handleNextPage = () => {
    if (currentPage < textPages.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      setViewedPages((prev) => new Set([...prev, nextPage]))
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setCurrentPage(currentPage - 1)
    }
  }

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onComplete()
  }

  const allPagesViewed = viewedPages.size === textPages.length

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.contentCard,
          { backgroundColor: colors.cardBackgroundLight },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.courseTitle, { color: colors.textSecondary }]}>
            Nome do Curso: {courseTitle}
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {sectionTitle}
          </Text>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={[styles.textContent, { color: colors.textPrimary }]}>
            {textPages[currentPage]}
          </Text>
        </View>

        {/* Page Counter */}
        <Text style={[styles.pageCounter, { color: colors.textPrimary }]}>
          {currentPage + 1}/{textPages.length}
        </Text>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: colors.backgroundPrimary },
              currentPage === 0 && styles.navButtonDisabled,
            ]}
            onPress={handlePreviousPage}
            disabled={currentPage === 0}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={currentPage === 0 ? colors.textSecondary : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: colors.backgroundPrimary },
              currentPage === textPages.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === textPages.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={28}
              color={
                currentPage === textPages.length - 1
                  ? colors.textSecondary
                  : colors.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Complete Button */}
      <View style={styles.buttonContainer}>
        <ButtonPrimary
          title="Concluir e Continuar"
          onPress={handleComplete}
          icon="checkmark"
          fullWidth
          disabled={!allPagesViewed}
        />
        {!allPagesViewed && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Leia todas as páginas para continuar
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  contentCard: {
    borderRadius: 16,
    padding: 24,
    flex: 1,
    marginBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  textContainer: {
    flex: 1,
    marginBottom: 24,
  },
  textContent: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400',
  },
  pageCounter: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  buttonContainer: {
    gap: 8,
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
  },
})

export default TextReadingCard
