import { Question } from '@/data/mock-data'
import { t } from '@/i18n/config'
import { useAuth } from '@/contexts/AuthContext'
import { Image as ExpoImage } from 'expo-image'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ImageAssociationCardProps {
  question: Question
  onAnswer: (isCorrect: boolean, selectedAnswer: number) => void
  currentQuestion: number
  totalQuestions: number
  onExit?: () => void
}

const ImageAssociationCard: React.FC<ImageAssociationCardProps> = ({
  question,
  onAnswer,
  currentQuestion,
  totalQuestions,
  onExit,
}) => {
  const insets = useSafeAreaInsets()
  const { token } = useAuth()
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    setSelectedIndex(null)
    setHasSubmitted(false)
  }, [question.id])

  const imageSource = question.imageUrl
    ? {
        uri: question.imageUrl,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    : undefined

  const handleSelect = (index: number) => {
    if (hasSubmitted) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIndex(index)
    setHasSubmitted(true)

    const isCorrect = index === question.correctAnswer
    Haptics.notificationAsync(
      isCorrect
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error
    )

    setTimeout(() => {
      onAnswer(isCorrect, index)
    }, 900)
  }

  const options = question.options ?? []
  const pairs: [string, string][] = []
  for (let i = 0; i < options.length; i += 2) {
    pairs.push([options[i], options[i + 1]])
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {imageSource && (
          <ExpoImage
            source={imageSource}
            style={styles.image}
            contentFit="cover"
          />
        )}

        <Text style={styles.instruction}>{question.question}</Text>

        <Text style={styles.counter}>
          {currentQuestion}/{totalQuestions}
        </Text>

        <View style={styles.grid}>
          {pairs.map(([left, right], rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {[left, right].map((word, colIndex) => {
                const index = rowIndex * 2 + colIndex
                const isSelected = selectedIndex === index
                const isCorrect = index === question.correctAnswer
                const showCorrect = hasSubmitted && isCorrect
                const showWrong = hasSubmitted && isSelected && !isCorrect

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionCard,
                      showCorrect && styles.optionCorrect,
                      showWrong && styles.optionWrong,
                    ]}
                    onPress={() => handleSelect(index)}
                    disabled={hasSubmitted}
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        (showCorrect || showWrong) && styles.optionTextSelected,
                      ]}
                    >
                      {word}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {onExit && (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity activeOpacity={0.74} onPress={onExit}>
            <Text style={styles.exitText}>{t('section.exitActivity')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    gap: 24,
    paddingBottom: 16,
  },
  image: {
    width: 325,
    height: 325,
    borderRadius: 12,
  },
  instruction: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    color: '#141B1F',
    alignSelf: 'flex-start',
  },
  counter: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: '#28363E',
    alignSelf: 'flex-start',
  },
  grid: {
    width: '100%',
    gap: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C1CFD7',
    backgroundColor: '#FAFEFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#28363E',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  optionCorrect: {
    backgroundColor: '#C6F27E',
    borderColor: '#70A31F',
  },
  optionWrong: {
    backgroundColor: '#F28985',
    borderColor: '#D62B25',
  },
  optionText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '400',
    color: '#141B1F',
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: '700',
  },
  footer: {
    width: '100%',
    alignItems: 'flex-end',
    paddingTop: 12,
  },
  exitText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: '#D62B25',
    textDecorationLine: 'underline',
  },
})

export default ImageAssociationCard
