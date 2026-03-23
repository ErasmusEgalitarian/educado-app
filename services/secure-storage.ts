import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'educado_auth_token'

/**
 * Store the auth token in the Android Keystore via expo-secure-store.
 * Data is encrypted at rest and not included in backups.
 */
export async function setSecureToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getSecureToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function removeSecureToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}
