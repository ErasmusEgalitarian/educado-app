import { Tabs } from 'expo-router'
import React from 'react'

const TabsLayout = () => {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ headerShown: false }} />
    </Tabs>
  )
}

export default TabsLayout
