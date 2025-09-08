import { ActivityIndicator, ActivityIndicatorProps, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { colors } from '@/constants/theme'

const Loading = ({
    size = "large",
    color = colors.primaryDark
}: ActivityIndicatorProps) => {
  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}

export default Loading

const styles = StyleSheet.create({})