import AsyncStorage from '@react-native-async-storage/async-storage'

const DEVICE_ID_KEY = 'device_id'

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get or create a persistent device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY)

    if (!deviceId) {
      deviceId = generateDeviceId()
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
      console.log('Generated new device ID:', deviceId)
    }

    return deviceId
  } catch (error) {
    console.error('Error getting device ID:', error)
    // Fallback to session-only ID if storage fails
    return generateDeviceId()
  }
}

/**
 * Clear the stored device ID (useful for testing)
 */
export async function clearDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY)
    console.log('Device ID cleared')
  } catch (error) {
    console.error('Error clearing device ID:', error)
  }
}
