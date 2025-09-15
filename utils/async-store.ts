import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Static class for managing AsyncStorage operations
 */
export class AsyncStore {
  /**
   * Set a value in AsyncStorage
   * @param key The key to store the value under
   * @param value The string value to store
   * @returns Promise that resolves when the value is stored
   */
  static async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.error(`Error storing value for key "${key}":`, error)
      throw error
    }
  }

  /**
   * Get a value from AsyncStorage
   * @param key The key to retrieve the value from
   * @returns Promise that resolves with the string value or null if not found
   */
  static async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      console.error(`Error retrieving value for key "${key}":`, error)
      return null
    }
  }

  /**
   * Clear a value from AsyncStorage
   * @param key The key to clear
   * @returns Promise that resolves when the value is cleared
   */
  static async clear(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error(`Error clearing value for key "${key}":`, error)
      throw error
    }
  }

  /**
   * Clear all values from AsyncStorage
   * @returns Promise that resolves when all values are cleared
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear()
    } catch (error) {
      console.error('Error clearing all stored values:', error)
      throw error
    }
  }

  /**
   * Get all keys from AsyncStorage
   * @returns Promise that resolves with an array of keys
   */
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys()
    } catch (error) {
      console.error('Error getting all stored keys:', error)
      return []
    }
  }
}
