import Providers from '@/components/Providers/ProviderWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Stack, usePathname, useRouter, useSegments } from 'expo-router'
import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

function RootNavigator() {
  const { languageVersion } = useLanguage()
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // Route groups with () are URL-transparent on web,
    // so segments[0] won't be '(auth)' there — check pathname too.
    const inAuthGroup =
      segments[0] === '(auth)' ||
      pathname === '/login' ||
      pathname === '/register'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, segments, pathname])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#35A1B1" />
      </View>
    )
  }

  return (
    <Stack key={languageVersion} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFEFF',
  },
})
