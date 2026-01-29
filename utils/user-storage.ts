import { AsyncStore } from './async-store'

const USER_STORAGE_KEY = 'educado_user'

interface User {
  id: string
  username: string
  createdAt: string
}

/**
 * Get the current user from storage
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const storedUser = await AsyncStore.get(USER_STORAGE_KEY)
    if (storedUser) {
      return JSON.parse(storedUser)
    }
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get just the username from storage
 */
export async function getUsername(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.username || null
}
