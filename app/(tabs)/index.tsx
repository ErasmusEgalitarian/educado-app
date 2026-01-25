import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

export default function Index() {
  const router = useRouter()
  const colors = AppColors()

  const handleContinue = () => {
    router.push('/courses')
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryLight }]}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo_black240.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <ButtonPrimary
          title="Continue"
          onPress={handleContinue}
          icon="arrow-forward"
          fullWidth
        />
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
    paddingHorizontal: 24,
  },
  logo: {
    width: 240,
    height: 240,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
})
