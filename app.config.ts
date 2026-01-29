// Environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001'

export default {
  expo: {
    name: 'Educado',
    slug: 'educado',
    version: '1.0.3',
    orientation: 'portrait',
    icon: './assets/images/logo_black240.png',
    scheme: 'educado',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      API_URL,
      eas: {
        projectId: "d286ed3c-ebc2-4462-83d1-447c2a59fb4b",
      }
    },
    ios: {
      name: 'Educado',
      supportsTablet: true,
      bundleIdentifier: 'com.educado2.app',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/logo_black240.png',
      },
      package: 'com.educado2.app',
      versionCode: 3,
    },
    plugins: [
      'expo-router',
      'expo-video',
      [
        'expo-media-library',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to save your certificates.',
          savePhotosPermission: 'Allow $(PRODUCT_NAME) to save your certificates.',
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/logo_black240.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
}
