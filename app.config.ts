export default {
  expo: {
    name: 'Educado',
    slug: 'educado',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/images/logo_black240.png',
    scheme: 'educado',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    extra: {
      eas: {
        projectId: "41f43939-b81b-4ea6-850f-908caf2e414b",
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/logo_black240.png',
      },
      package: 'com.educado2.app',
      versionCode: 5,
    },
    plugins: [
      'expo-router',
      'expo-video',
      'expo-secure-store',
      './plugins/withAndroidSecurity',
      [
        'expo-media-library',
        {
          photosPermission: 'Allow $(PRODUCT_NAME) to save your certificates.',
          savePhotosPermission: 'Allow $(PRODUCT_NAME) to save your certificates.',
          isAccessMediaLocationEnabled: false,
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
