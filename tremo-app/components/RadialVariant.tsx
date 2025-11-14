import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RadialSlider } from 'react-native-radial-slider';

type RadialVariantProps = {
  value: number;
  onValueChange: (val: number) => void;
};

const RadialVariant = ({ value, onValueChange }: RadialVariantProps) => {
  return (
    <View style={styles.container}>
      <RadialSlider
        variant="radial-circle-slider"
        value={value}
        unit="Hz"
        subTitle="Intensity"
        min={0}
        max={100}
        onChange={onValueChange}
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





// import React, { useState } from 'react';
// import { StyleSheet, View } from 'react-native';
// import { RadialSlider } from 'react-native-radial-slider';

// const RadialVariant = () => {
//   const [radialIntensity, setRadialIntensity] = useState(0);

//   return (
//     <View style={styles.container}>
//       <RadialSlider
//         variant={'radial-circle-slider'}
//         value={radialIntensity}
//         unit='Hz'
//         subTitle='Intensity'
//         min={0}
//         max={100}
//         onChange={setRadialIntensity}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

// export default RadialVariant;