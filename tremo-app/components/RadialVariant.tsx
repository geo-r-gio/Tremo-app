import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { RadialSlider } from 'react-native-radial-slider';

type RadialVariantProps = {
  value: number;
  onValueChange: (val: number) => void;
};

const RadialVariant: React.FC<RadialVariantProps> = ({ value, onValueChange }) => {
  const [internalValue, setInternalValue] = useState(value);
  const isDragging = useRef(false);

  // Only sync parent changes when not dragging
  useEffect(() => {
    if (!isDragging.current) {
      setInternalValue(value);
    }
  }, [value]);

  const latestValueRef = useRef(internalValue);

  const handleChange = (val: number) => {
    isDragging.current = true;
    latestValueRef.current = val;  // store the latest value
    setInternalValue(val);
  };

  const handleComplete = () => {
    isDragging.current = false;
    // console.log('Final Value on Complete:', latestValueRef.current);
    onValueChange(latestValueRef.current);
  };

  return (
    <View style={styles.container}>
      <RadialSlider
        variant="radial-circle-slider"
        value={internalValue}
        unit="Hz"
        subTitle="Intensity"
        min={0}
        max={100}
        onChange={handleChange}
        onComplete={handleComplete} // only update parent here
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default React.memo(RadialVariant);