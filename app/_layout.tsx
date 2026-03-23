import Providers from '@/components/Providers/ProviderWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Redirect, Stack } from 'expo-router'
import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

function RootNavigator() {
  const { languageVersion } = useLanguage()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#35A1B1" />
      </View>
    )
  }

  return (
    <>
      <Stack key={languageVersion} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {/* Redirect based on auth state */}
      {!isAuthenticated && <Redirect href="/(auth)" />}
    </>
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
