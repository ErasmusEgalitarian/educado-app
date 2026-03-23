import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useGamificationSummary } from '@/hooks/useGamification'
import { changeLanguage, getCurrentLanguage, t } from '@/i18n/config'
import { getImageUrl } from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const colors = AppColors()
  const { currentLanguage, refreshLanguage } = useLanguage()
  const insets = useSafeAreaInsets()
  const { user, token, logout } = useAuth()
  const router = useRouter()
  const { data: gamification } = useGamificationSummary()

  const firstName = user?.firstName || ''
  const lastName = user?.lastName || ''
  const userName = `${firstName} ${lastName}`.trim() || t('profile.avatarName')
  const userEmail = user?.email || t('profile.userEmail')
  const userInitials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'AA'

  const daysStreak = gamification?.currentStreak ?? 0
  const level = gamification?.currentLevel ?? 1
  const xpProgress = gamification?.xpProgress ?? 0
  const xpNeeded = gamification?.xpNeeded ?? 1
  const levelProgress = xpNeeded > 0 ? Math.min((xpProgress / xpNeeded) * 100, 100) : 0

  const handleMenuPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    switch (screen) {
      case 'editProfile':
        router.push('/(tabs)/edit-profile')
        break
      case 'certificates':
        router.push('/(tabs)/certificates')
        break
      case 'ranking':
        router.push('/(tabs)/ranking')
        break
      case 'download':
        router.push('/(tabs)/downloads')
        break
      default:
        console.log(`Navigate to: ${screen}`)
    }
  }

  const handleToggleLanguage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = getCurrentLanguage() === 'pt-BR' ? 'en' : 'pt-BR'
    await changeLanguage(next)
    refreshLanguage()
  }

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(t('auth.logoutConfirmTitle'), t('auth.logoutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout()
        },
      },
    ])
  }

  const menuItems = [
    {
      id: 'editProfile',
      label: t('profile.editProfile'),
      icon: 'person-outline' as const,
    },
    {
      id: 'certificates',
      label: t('profile.certificates'),
      icon: 'ribbon-outline' as const,
    },
    {
      id: 'ranking',
      label: t('profile.ranking'),
      icon: 'trophy-outline' as const,
    },
    {
      id: 'download',
      label: t('profile.download'),
      icon: 'download-outline' as const,
    },
  ]

  const languageLabel =
    currentLanguage === 'pt-BR' ? 'Português (BR)' : 'English'
  const switchToLabel =
    currentLanguage === 'pt-BR' ? 'Switch to English' : 'Mudar para Português'

  return (
    <View
      key={currentLanguage}
      style={[
        styles.container,
        { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {user?.avatarMediaId ? (
            <Image
              source={{ uri: getImageUrl(user.avatarMediaId, token ?? undefined) }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#E0F2F1' }]}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View
          style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[styles.statBadgeSingle, { backgroundColor: '#6EBE44' }]}
          >
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>
              {t('profile.daysStreak', { count: daysStreak })}
            </Text>
          </View>

          <View style={styles.levelContainer}>
            <Text style={[styles.levelText, { color: colors.textPrimary }]}>
              {t('profile.level', { level })}
            </Text>
            <View style={styles.levelProgressBar}>
              <View
                style={[
                  styles.levelProgressFill,
                  { width: `${levelProgress}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => handleMenuPress(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {item.label}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}

          {/* Language option inline in the menu */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleToggleLanguage}
            activeOpacity={0.7}
          >
            <View style={styles.languageRow}>
              <Ionicons
                name="globe-outline"
                size={20}
                color={colors.textPrimary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>
                {languageLabel}
              </Text>
            </View>
            <Text style={[styles.languageSwitchText, { color: colors.primary }]}>
              {switchToLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00796B',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statBadgeSingle: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    marginBottom: 16,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  levelContainer: {
    marginTop: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  levelProgressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#4A90A4',
    borderRadius: 5,
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageSwitchText: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
})
