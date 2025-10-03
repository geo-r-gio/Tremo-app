import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const reports = () => {
  return (
    <View style={styles.container}>
      <Text>reports</Text>
    </View>
  )
}

export default reports

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})