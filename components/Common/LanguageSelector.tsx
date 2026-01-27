import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { changeLanguage, getCurrentLanguage, t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface Language {
  code: 'en' | 'pt-BR'
  name: string
  nativeName: string
  flag: string
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
]

interface LanguageSelectorProps {
  onLanguageChange?: () => void
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageChange,
}) => {
  const colors = AppColors()
  const { refreshLanguage } = useLanguage()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'pt-BR'>(
    getCurrentLanguage()
  )

  const handleSelectLanguage = async (languageCode: 'en' | 'pt-BR') => {
    setSelectedLanguage(languageCode)
    await changeLanguage(languageCode)
    setIsModalVisible(false)

    // Refresh the language context to trigger re-renders
    refreshLanguage()

    // Trigger re-render by calling callback
    if (onLanguageChange) {
      onLanguageChange()
    }
  }

  const currentLanguage = LANGUAGES.find(
    (lang) => lang.code === selectedLanguage
  )

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.flag}>{currentLanguage?.flag}</Text>
          <Text style={[styles.languageName, { color: colors.textPrimary }]}>
            {currentLanguage?.nativeName}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('profile.language')}
            </Text>

            {LANGUAGES.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor:
                      selectedLanguage === language.code
                        ? colors.primaryLight
                        : 'transparent',
                  },
                ]}
                onPress={() => handleSelectLanguage(language.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionFlag}>{language.flag}</Text>
                <View style={styles.optionText}>
                  <Text
                    style={[styles.optionName, { color: colors.textPrimary }]}
                  >
                    {language.nativeName}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubName,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {language.name}
                  </Text>
                </View>
                {selectedLanguage === language.code && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  optionFlag: {
    fontSize: 32,
  },
  optionText: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionSubName: {
    fontSize: 14,
    marginTop: 2,
  },
})

export default LanguageSelector
