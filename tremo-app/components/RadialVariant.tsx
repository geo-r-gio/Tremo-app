import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RadialSlider } from 'react-native-radial-slider';

const RadialVariant = () => {
  const [speed, setSpeed] = useState(0);

  return (
    <View style={styles.container}>
      <RadialSlider
        variant={'radial-circle-slider'}
        value={speed}
        unit='Hz'
        subTitle='Intensity'
        min={0}
        max={100}
        onChange={setSpeed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RadialVariant;