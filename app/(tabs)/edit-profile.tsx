import { AppColors } from '@/constants/theme/AppColors'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n/config'
import {
  apiUpdateStudentProfile,
  apiGetStudentProfile,
  apiUploadImage,
  getAuthHeaders,
  getImageUrl,
  storeUser,
} from '@/services/api'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function EditProfileScreen() {
  const colors = AppColors()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { currentLanguage } = useLanguage()
  const { user, token, refreshUser } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [avatarMediaId, setAvatarMediaId] = useState<string | null>(null)
  const [newAvatarLocalUri, setNewAvatarLocalUri] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      const profile = await apiGetStudentProfile()
      setFirstName(profile.firstName)
      setLastName(profile.lastName)
      setEmail(profile.email ?? '')
      setPhone(profile.phone ?? '')
      setDateOfBirth(profile.dateOfBirth ?? '')
      if (profile.avatarMediaId) {
        setAvatarMediaId(profile.avatarMediaId)
        setAvatarUri(getImageUrl(profile.avatarMediaId))
      }
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setNewAvatarLocalUri(asset.uri)
      setAvatarUri(asset.uri)
    }
  }

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('common.error'), t('auth.registerFillRequired'))
      return
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setIsSaving(true)

    try {
      let newAvatarMediaId = avatarMediaId

      // Upload new avatar if selected
      if (newAvatarLocalUri) {
        const uploaded = await apiUploadImage(
          newAvatarLocalUri,
          `avatar-${Date.now()}.jpg`
        )
        newAvatarMediaId = uploaded.id
      }

      const updatedProfile = await apiUpdateStudentProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth.trim() || undefined,
        avatarMediaId: newAvatarMediaId,
      })

      // Update cached user in AuthContext
      if (user) {
        await storeUser({
          ...user,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          email: updatedProfile.email ?? user.email,
          avatarMediaId: updatedProfile.avatarMediaId,
        })
      }

      await refreshUser()
      Alert.alert(t('certificate.success'), t('profile.profileUpdated'))
      router.back()
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'))
    } finally {
      setIsSaving(false)
    }
  }

  const userInitials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'AA'

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: colors.backgroundPrimary },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      key={currentLanguage}
      style={[
        styles.container,
        { backgroundColor: colors.backgroundPrimary, paddingTop: insets.top },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('profile.editProfileTitle')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, 24) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
            {avatarUri ? (
              <Image
                source={{
                  uri: avatarUri,
                  headers: avatarUri.startsWith('http')
                    ? getAuthHeaders(token)
                    : undefined,
                }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#E0F2F1' }]}>
                <Text style={styles.avatarText}>{userInitials}</Text>
              </View>
            )}
            <View
              style={[styles.cameraIcon, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>
              {t('profile.changePhoto')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          <FieldInput
            label={t('auth.firstName')}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('auth.firstNamePlaceholder')}
            colors={colors}
          />
          <FieldInput
            label={t('auth.lastName')}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('auth.lastNamePlaceholder')}
            colors={colors}
          />
          <FieldInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            colors={colors}
          />
          <FieldInput
            label={t('profile.phone')}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phonePlaceholder')}
            keyboardType="phone-pad"
            colors={colors}
          />
          <FieldInput
            label={t('profile.dateOfBirth')}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder={t('profile.dateOfBirthPlaceholder')}
            colors={colors}
          />
        </View>
      </ScrollView>

      {/* Save button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.cardBackground,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {t('profile.saveChanges')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string
  value: string
  onChangeText: (text: string) => void
  placeholder: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  colors: ReturnType<typeof AppColors>
}) {
  return (
    <View style={fieldStyles.container}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <TextInput
        style={[
          fieldStyles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.cardBackground,
            borderColor: '#E5E7EB',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  )
}

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: { padding: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#00796B' },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  changePhotoText: { fontSize: 15, fontWeight: '600', marginTop: 10 },
  fields: {},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
})
