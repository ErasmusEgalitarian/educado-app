import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n/config'
import { ApiError } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export default function RegisterScreen() {
  const colors = AppColors()
  const { registerStudent } = useAuth()
  const { currentLanguage } = useLanguage()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common.error'), t('auth.registerFillRequired'))
      return
    }

    setIsLoading(true)
    try {
      await registerStudent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      // After successful registration, state becomes isAuthenticated=true
      // and the _layout.tsx Redirect will handle navigation.
      // But to be safe, also do explicit navigation:
      router.replace('/(tabs)')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          Alert.alert(t('common.error'), t('auth.emailAlreadyExists'))
        } else if (error.status === 422) {
          Alert.alert(t('common.error'), t('auth.validationError'))
        } else {
          Alert.alert(t('common.error'), t('auth.serverError'))
        }
      } else {
        Alert.alert(t('common.error'), t('auth.networkError'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.backgroundPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        key={currentLanguage}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo_black240.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View
          style={[styles.formCard, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('auth.registerTitle')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('auth.registerSubtitle')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('auth.firstName')} *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.backgroundPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('auth.firstNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('auth.lastName')} *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.backgroundPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('auth.lastNamePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('auth.emailOptional')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.backgroundPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t('auth.phoneOptional')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.backgroundPrimary,
                  borderColor: colors.border,
                },
              ]}
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <ButtonPrimary
              title={t('auth.createAccount')}
              onPress={handleRegister}
              icon="person-add"
              fullWidth
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 0,
  },
  header: {
    paddingTop: 56,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  formCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
})
