import { getCurrentLanguage, initializeI18n } from '@/i18n/config'
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react'

interface LanguageContextType {
  currentLanguage: 'en' | 'pt-BR'
  refreshLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: 'en',
  refreshLanguage: () => {},
})

export const useLanguage = () => useContext(LanguageContext)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'pt-BR'>('en')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initLanguage = async () => {
      await initializeI18n()
      setCurrentLanguage(getCurrentLanguage())
      setIsInitialized(true)
    }
    initLanguage()
  }, [])

  const refreshLanguage = () => {
    setCurrentLanguage(getCurrentLanguage())
  }

  if (!isInitialized) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ currentLanguage, refreshLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}
