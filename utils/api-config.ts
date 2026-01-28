import Constants from 'expo-constants'

export const API_BASE_URL =
  Constants.expoConfig?.extra?.API_URL || 'http://10.0.2.2:5001'
