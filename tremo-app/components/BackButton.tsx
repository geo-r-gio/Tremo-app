import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { BackButtonProps } from '@/types'
import { useRouter } from 'expo-router'
import { CaretLeftIcon } from 'phosphor-react-native'
import { verticalScale } from '@/utils/styling'
import { colors } from '@/constants/theme'

const BackButton = ({
  style,
  iconSize = 26
}: BackButtonProps) => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} style={[styles.button, style]}>
      <CaretLeftIcon size={verticalScale(iconSize)} weight="bold" />
    </TouchableOpacity>
  )
}

export default BackButton

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neutral300,
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 5
  }
})