import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSyncAllProgress } from '@/hooks/api/useProgressSync'
import { changeLanguage, t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const { mutate: syncAll, isPending: isSyncing } = useSyncAllProgress()

  // Mock data - replace with real data later
  const userInitials = 'AA'
  const userName = t('profile.avatarName')
  const userEmail = t('profile.userEmail')
  const daysStreak = 1
  const level = 1
  const levelProgress = 75 // percentage

  const handleMenuPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (screen === 'language') {
      setShowLanguageModal(true)
      return
    }

    if (screen === 'sync') {
      syncAll(undefined, {
        onSuccess: () => {
          Alert.alert('Success', 'Progress synced successfully')
        },
        onError: (error) => {
          Alert.alert('Error', 'Failed to sync progress')
          console.error(error)
        },
      })
      return
    }

    // Navigate to respective screens
    console.log(`Navigate to: ${screen}`)
  }

  const handleLanguageChange = async (language: 'en' | 'pt-BR') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await changeLanguage(language)
    refreshLanguage()
    setShowLanguageModal(false)
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
    {
      id: 'sync',
      label: 'Sync Progress',
      icon: 'cloud-upload-outline',
    },
    { id: 'ranking', label: t('profile.ranking'), icon: 'trophy-outline' },
    {
      id: 'language',
      label: t('profile.language'),
      icon: 'language-outline',
      value: currentLanguage === 'en' ? 'English' : 'Português',
    },
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
              <View style={styles.menuRight}>
                {item.id === 'language' && (
                  <Text
                    style={[
                      styles.languageValue,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.value}
                  </Text>
                )}
                {item.id === 'sync' && isSyncing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={colors.textSecondary}
                  />
                )}
              </View>>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {t('profile.language')}
            </Text>

            <TouchableOpacity
              style={[
                styles.languageOption,
                currentLanguage === 'en' && styles.languageOptionActive,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    currentLanguage === 'en' ? '#4A90A4' : 'transparent',
                },
              ]}
              onPress={() => handleLanguageChange('en')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  {
                    color:
                      currentLanguage === 'en' ? '#FFFFFF' : colors.textPrimary,
                  },
                ]}
              >
                English
              </Text>
              {currentLanguage === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                currentLanguage === 'pt-BR' && styles.languageOptionActive,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    currentLanguage === 'pt-BR' ? '#4A90A4' : 'transparent',
                },
              ]}
              onPress={() => handleLanguageChange('pt-BR')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  {
                    color:
                      currentLanguage === 'pt-BR'
                        ? '#FFFFFF'
                        : colors.textPrimary,
                  },
                ]}
              >
                Português (Brasil)
              </Text>
              {currentLanguage === 'pt-BR' && (
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: colors.border },
              ]}
              onPress={() => setShowLanguageModal(false)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.modalCloseButtonText,
                  { color: colors.textPrimary },
                ]}
              >
                {t('common.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageValue: {
    fontSize: 14,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  languageOptionActive: {
    borderWidth: 0,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCloseButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
