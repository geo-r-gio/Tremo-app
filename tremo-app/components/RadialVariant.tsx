import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { RadialSlider } from 'react-native-radial-slider';

type RadialVariantProps = {
  value: number;
  onValueChange: (val: number) => void;
};

const RadialVariant: React.FC<RadialVariantProps> = ({ value, onValueChange }) => {
  const [internalValue, setInternalValue] = useState(value);
  
  const isDragging = useRef(false);
  const latestValueRef = useRef(value);

  useEffect(() => {
    if (!isDragging.current && value !== internalValue) {
        setInternalValue(value);
        latestValueRef.current = value;
    }
  }, [value]);

  const handleChange = useCallback((val: number) => {
    isDragging.current = true;
    const rounded = Math.round(val);

    // Guard: Ignore if value hasn't changed
    if (rounded === latestValueRef.current) return;

    latestValueRef.current = rounded;

    setTimeout(() => {
        setInternalValue(rounded);
    }, 0);
  }, []);

  const handleComplete = useCallback(() => {
    // Small delay to ensure the drag flag clears AFTER the last render
    setTimeout(() => {
        isDragging.current = false;
        console.log('Final Value:', latestValueRef.current);
        onValueChange(latestValueRef.current);
    }, 50);
  }, [onValueChange]);

  return (
    <View style={styles.container}>
      <RadialSlider
        key={`slider-${isDragging.current ? 'dragging' : value}`} 
        variant="radial-circle-slider"
        value={internalValue}
        unit="%"
        subTitle="Intensity"
        min={0}
        max={100}
        onChange={handleChange}
        onComplete={handleComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default React.memo(RadialVariant);
