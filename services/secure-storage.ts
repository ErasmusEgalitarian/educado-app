import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const TOKEN_KEY = 'educado_auth_token'

/**
 * Store the auth token securely.
 * Native: Android Keystore / iOS Keychain via expo-secure-store.
 * Web: falls back to AsyncStorage (localStorage) since expo-secure-store
 *      has no web implementation.
 */
export async function setSecureToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, token)
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  }
}

export async function getSecureToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(TOKEN_KEY)
  }
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function removeSecureToken(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY)
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  }
}
