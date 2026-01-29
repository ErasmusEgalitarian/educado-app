import LoginScreen from '@/components/Auth/LoginScreen'
import { AppColors } from '@/constants/theme/AppColors'
import { useUser } from '@/contexts/UserContext'
import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export default function Index() {
  const colors = AppColors()
  const { user, isLoading } = useUser()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContainer,
          { backgroundColor: colors.primaryLight },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  // If user is logged in, redirect to tabs
  if (user) {
    return <Redirect href="/(tabs)" />
  }

  // Show login screen if not authenticated
  return <LoginScreen />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
