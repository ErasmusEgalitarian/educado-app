import { AppColors } from '@/constants/theme/AppColors'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const HomeCard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello My New Friend</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: AppColors().text,
  },
})

export default HomeCard
