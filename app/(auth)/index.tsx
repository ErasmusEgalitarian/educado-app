import ButtonPrimary from '@/components/Common/ButtonPrimary'
import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { changeLanguage, getCurrentLanguage, t } from '@/i18n/config'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function AuthLandingScreen() {
  const colors = AppColors()
  const router = useRouter()
  const { currentLanguage, refreshLanguage } = useLanguage()

  const handleToggleLanguage = async () => {
    const next = getCurrentLanguage() === 'pt-BR' ? 'en' : 'pt-BR'
    await changeLanguage(next)
    refreshLanguage()
  }

  return (
    <View
      key={currentLanguage}
      style={[styles.container, { backgroundColor: colors.primaryLight }]}
    >
      {/* Language toggle — top right */}
      <View style={styles.languageRow}>
        <TouchableOpacity
          style={[styles.languageButton, { borderColor: colors.primary }]}
          onPress={handleToggleLanguage}
          activeOpacity={0.7}
        >
          <Text style={[styles.languageFlag]}>🌐</Text>
          <Text style={[styles.languageLabel, { color: colors.primary }]}>
            {currentLanguage === 'pt-BR' ? 'English' : 'Português'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logo & Welcome */}
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/logo_black240.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('auth.welcomeTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('auth.welcomeSubtitle')}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <ButtonPrimary
          title={t('auth.createAccount')}
          onPress={() => router.push('/(auth)/register')}
          icon="person-add"
          fullWidth
        />

        <View style={styles.dividerRow}>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            {t('auth.or')}
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border }]}
          />
        </View>

        <ButtonPrimary
          title={t('auth.loginExisting')}
          onPress={() => router.push('/(auth)/login')}
          icon="log-in"
          variant="outline"
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
  languageRow: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  languageFlag: {
    fontSize: 16,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
})
