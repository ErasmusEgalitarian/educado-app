import Providers from '@/components/Providers/ProviderWrapper'
import { useLanguage } from '@/contexts/LanguageContext'
import { Stack } from 'expo-router'
import React from 'react'

function RootNavigator() {
  const { languageVersion } = useLanguage()

  return (
    <Stack key={languageVersion} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(landing)/index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <Providers>
      <RootNavigator />
    </Providers>
  )
}
