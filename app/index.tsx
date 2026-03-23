import { useAuth } from '@/contexts/AuthContext'
import { Redirect } from 'expo-router'

export default function Index() {
  const { isAuthenticated } = useAuth()

  // Root index just redirects based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />
  }

  return <Redirect href="/(auth)" />
}
