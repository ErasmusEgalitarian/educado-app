import Providers from '@/components/Providers/ProviderWrapper'
import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="courses/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="courses/[courseId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="courses/[courseId]/section/[sectionId]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="courses/[courseId]/certificate"
          options={{ headerShown: false }}
        />
      </Stack>
    </Providers>
  )
}
