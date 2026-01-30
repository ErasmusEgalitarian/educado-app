import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { useUser } from '@/contexts/UserContext'
import { changeLanguage, t } from '@/i18n/config'
import { Certificate, getCertificates } from '@/utils/progress-storage'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProfileScreen() {
  const colors = AppColors()
  const { currentLanguage, refreshLanguage } = useLanguage()
  const { user } = useUser()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [showEditNameModal, setShowEditNameModal] = useState(false)
  const [showCertificatesModal, setShowCertificatesModal] = useState(false)
  const [editedUsername, setEditedUsername] = useState('')
  const [certificates, setCertificates] = useState<Certificate[]>([])

  const userName = user?.username || t('profile.avatarName')
  const userInitials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const daysStreak = 1

  // Load certificates
  useEffect(() => {
    loadCertificates()
  }, [])

  const loadCertificates = async () => {
    try {
      const certs = await getCertificates()
      setCertificates(certs)
    } catch (error) {
      console.error('Error loading certificates:', error)
    }
  }

  const handleMenuPress = (screen: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (screen === 'language') {
      setShowLanguageModal(true)
      return
    }

    if (screen === 'editProfile') {
      setEditedUsername(userName)
      setShowEditNameModal(true)
      return
    }

    if (screen === 'certificates') {
      loadCertificates()
      setShowCertificatesModal(true)
      return
    }

    // Navigate to respective screens
    console.log(`Navigate to: ${screen}`)
  }

  const handleSaveUsername = async () => {
    if (!editedUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty')
      return
    }

    // TODO: Update username in backend
    // For now, just show a message
    Alert.alert(
      'Coming Soon',
      'Username editing will be available in a future update'
    )
    setShowEditNameModal(false)
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
      badge: certificates.length > 0 ? certificates.length.toString() : null,
    },
    {
      id: 'language',
      label: t('profile.language'),
      icon: 'language-outline',
      value: currentLanguage === 'en' ? 'English' : 'Português',
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
              {certificates.length}{' '}
              {certificates.length === 1 ? 'certificate' : 'certificates'}
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
                {item.id === 'language' && item.value && (
                  <Text
                    style={[
                      styles.languageValue,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.value}
                  </Text>
                )}
                {item.badge && (
                  <View
                    style={[styles.badge, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
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

      {/* Edit Username Modal */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditNameModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Edit Username
            </Text>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.backgroundPrimary,
                  color: colors.textPrimary,
                  borderColor: colors.border,
                },
              ]}
              value={editedUsername}
              onChangeText={setEditedUsername}
              placeholder="Enter your username"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setShowEditNameModal(false)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: colors.textPrimary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSaveUsername}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Certificates Modal */}
      <Modal
        visible={showCertificatesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCertificatesModal(false)}
      >
        <View style={styles.fullModalOverlay}>
          <View
            style={[
              styles.fullModalContent,
              { backgroundColor: colors.backgroundPrimary },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <TouchableOpacity
                onPress={() => setShowCertificatesModal(false)}
                style={styles.modalCloseIcon}
              >
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                My Certificates
              </Text>
              <View style={styles.modalCloseIcon} />
            </View>

            {certificates.length === 0 ? (
              <View style={styles.emptyCertificates}>
                <Ionicons
                  name="ribbon-outline"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.emptyCertificatesText,
                    { color: colors.textSecondary },
                  ]}
                >
                  No certificates yet
                </Text>
                <Text
                  style={[
                    styles.emptyCertificatesSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  Complete a course to earn your first certificate
                </Text>
              </View>
            ) : (
              <FlatList
                data={certificates}
                keyExtractor={(item) => item.courseId}
                contentContainerStyle={styles.certificatesList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.certificateItem,
                      { backgroundColor: colors.cardBackground },
                    ]}
                    onPress={() => {
                      setShowCertificatesModal(false)
                      router.push(
                        `/(tabs)/courses/${item.courseId}/certificate`
                      )
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.certificateIcon}>
                      <Ionicons name="ribbon" size={32} color="#4A90A4" />
                    </View>
                    <View style={styles.certificateInfo}>
                      <Text
                        style={[
                          styles.certificateTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {item.courseName}
                      </Text>
                      <Text
                        style={[
                          styles.certificateDate,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Completed{' '}
                        {new Date(item.completedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
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
  badge: {
    backgroundColor: '#4A90A4',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#4A90A4',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullModalContent: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certificatesList: {
    padding: 16,
  },
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  certificateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 14,
  },
  emptyCertificates: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCertificatesText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCertificatesSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
})
