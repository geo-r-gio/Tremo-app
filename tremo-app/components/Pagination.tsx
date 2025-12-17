import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { OnboardingData } from '@/data/onboarding'
import { SharedValue } from 'react-native-reanimated'
import Dot from './Dot'

type Props = {
  length: number;
  x: SharedValue<number>;
};

const Pagination = ({ length, x }: Props) => {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length }).map((_, index) => (
        <Dot key={index} index={index} x={x} />
      ))}
    </View>
  );
};

export default Pagination

const styles = StyleSheet.create({
    paginationContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center'
    }
})