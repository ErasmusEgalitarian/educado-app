import { AppColors } from '@/constants/theme/AppColors'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

export default function ExploreScreen() {
  const colors = AppColors()

  return (
    <View
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
    >
      <View style={styles.content}>
        <Ionicons name="compass" size={80} color={colors.primary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Explore
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Coming soon! Discover new courses and learning paths.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
})
