import { initializeI18n } from '@/i18n/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode, useEffect, useState } from 'react'

type ProvidersProps = {
  children: ReactNode
}

const queryClient = new QueryClient()

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    const initI18n = async () => {
      await initializeI18n()
      setIsI18nInitialized(true)
    }
    initI18n()
  }, [])

  // Wait for i18n to initialize before rendering the app
  if (!isI18nInitialized) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default Providers
