import Providers from '@/components/Providers/ProviderWrapper'
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  )
}
