import AsyncStorage from '@react-native-async-storage/async-storage'
import { I18n } from 'i18n-js'
import en from '../locales/en.json'
import ptBR from '../locales/pt-BR.json'

const LANGUAGE_STORAGE_KEY = '@educado:language'

// Create the i18n instance
export const i18n = new I18n({
  en: en,
  'pt-BR': ptBR,
})

// Set default locale
i18n.defaultLocale = 'en'
i18n.locale = 'en'

// Enable fallback to default locale
i18n.enableFallback = true

// Initialize language from storage
export const initializeI18n = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (
      savedLanguage &&
      (savedLanguage === 'en' || savedLanguage === 'pt-BR')
    ) {
      i18n.locale = savedLanguage
    }
  } catch (error) {
    console.error('Failed to load saved language:', error)
  }
}

// Change language and persist to storage
export const changeLanguage = async (language: 'en' | 'pt-BR') => {
  try {
    i18n.locale = language
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch (error) {
    console.error('Failed to save language:', error)
  }
}

// Get current language
export const getCurrentLanguage = (): 'en' | 'pt-BR' => {
  return i18n.locale as 'en' | 'pt-BR'
}

// Get current locale for date formatting
export const getCurrentLocale = (): string => {
  return i18n.locale === 'pt-BR' ? 'pt-BR' : 'en-US'
}

// Translation function
export const t = (key: string, options?: Record<string, unknown>) => {
  return i18n.t(key, options)
}

export default i18n
