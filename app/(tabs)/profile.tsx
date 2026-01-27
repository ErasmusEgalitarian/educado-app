import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const colors = AppColors()
  const { currentLanguage } = useLanguage()
  const insets = useSafeAreaInsets()

  // Mock data - replace with real data later
  const userInitials = 'AA'
  const userName = t('profile.avatarName')
  const userEmail = t('profile.userEmail')
  const daysStreak = 1
  const level = 1
  const levelProgress = 75 // percentage

  const handleMenuPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // Navigate to respective screens
    console.log(`Navigate to: ${screen}`)
  }

  const menuItems = [
    {
      id: 'editProfile',
      label: t('profile.editProfile'),
      icon: 'person-outline',
    },
    {
      id: 'certificates',
      label: t('profile.certificates'),
      icon: 'ribbon-outline',
    },
    { id: 'ranking', label: t('profile.ranking'), icon: 'trophy-outline' },
    { id: 'download', label: t('profile.download'), icon: 'download-outline' },
    {
      id: 'changePassword',
      label: t('profile.changePassword'),
      icon: 'lock-closed-outline',
    },
  ]

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
          <View style={[styles.avatar, { backgroundColor: '#E0F2F1' }]}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
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
          {/* Streak Card */}
          <View
            style={[styles.statBadgeSingle, { backgroundColor: '#6EBE44' }]}
          >
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>
              {t('profile.daysStreak', { count: daysStreak })}
            </Text>
          </View>

          {/* Level Progress */}
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
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                {
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
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
        </View>
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
})
