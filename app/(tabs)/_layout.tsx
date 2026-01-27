import { AppColors } from '@/constants/theme/AppColors'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/i18n/config'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'

const TabsLayout = () => {
  const colors = AppColors()
  const { currentLanguage } = useLanguage()

  return (
    <Tabs
      key={currentLanguage}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.courses'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tabs.explore'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses/[courseId]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="courses/[courseId]/section/[sectionId]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="courses/[courseId]/certificate"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  )
}

export default TabsLayout
