import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { useUser } from '@/contexts/UserContext'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function LoginScreen() {
  const colors = AppColors()
  const { login, isLoggingIn } = useUser()
  const [username, setUsername] = useState('')

  const validateUsername = (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(value)
  }

  const handleLogin = async () => {
    const trimmedUsername = username.trim()

    if (!validateUsername(trimmedUsername)) {
      Alert.alert('Invalid Username', t('login.usernameError'))
      return
    }

    try {
      await login(trimmedUsername)
    } catch (error) {
      Alert.alert('Login Error', t('login.loginError'))
      console.error('Login error:', error)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.primaryLight }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo_black240.png')}
          style={styles.logo}
          contentFit="contain"
        />

        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('login.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('login.subtitle')}
          </Text>

          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.backgroundPrimary },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={24}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={t('login.usernamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!isLoggingIn}
              onSubmitEditing={handleLogin}
            />
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isLoggingIn ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <ButtonPrimary
            title={t('login.loginButton')}
            onPress={handleLogin}
            icon="arrow-forward"
            fullWidth
            disabled={username.trim().length < 3}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
    width: 200,
    height: 200,
    marginBottom: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
})
