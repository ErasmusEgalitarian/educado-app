import Providers from '@/components/Providers/ProviderWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Stack, usePathname, useRouter, useSegments } from 'expo-router'
import * as Clarity from '@microsoft/react-native-clarity'
import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

function RootNavigator() {
  const { languageVersion } = useLanguage()
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const pathname = usePathname()
  const router = useRouter()

  // Marca a tela atual no Clarity a cada navegacao do expo-router, populando a
  // aba de telas/heatmaps por rota no dashboard.
  useEffect(() => {
    if (pathname) {
      Clarity.setCurrentScreenName(pathname)
    }
  }, [pathname])

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
  }, [isAuthenticated, isLoading, segments, pathname, router])

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
  // Late initialization: inicializa o Clarity apos a montagem (a arvore de
  // views nativa ja existe), evitando capturar um unico frame vazio quando o
  // init roda cedo demais no carregamento do modulo.
  useEffect(() => {
    // Registrar o callback antes do initialize garante que a primeira sessao
    // seja logada. Confirma no logcat: adb logcat | grep -i clarity
    Clarity.setOnSessionStartedCallback((sessionId) => {
      Clarity.getCurrentSessionUrl().then((url) => {
        console.log('[Clarity] session started:', sessionId, url)
      })
    })
    Clarity.initialize('x7p00p7a9f', {
      logLevel: Clarity.LogLevel.Verbose,
    })
  }, [])

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
