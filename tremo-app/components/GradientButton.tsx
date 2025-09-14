import React, { useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MotiView } from 'moti';
import { Easing, withTiming } from 'react-native-reanimated';
import * as Icons from 'phosphor-react-native';

const BUTTON_SIZE = 160;

const GradientButton: React.FC = () => {
    const [animateRipple, setAnimateRipple] = useState(false);

    const handlePress = () => {
        setAnimateRipple(prev => !prev);
    };

  return (
    <Pressable onPress={handlePress} style={styles.buttonWrapper}>
        <View style={styles.shadowWrapper}>
            <View style={styles.buttonContainer}>
            {/* Ripple / animated background */}
            {[...Array(3).keys()].map(index => (
                <MotiView
                from={{ opacity: 0.7, scale: 1 }}
                animate={animateRipple ? { opacity: 0, scale: 2 } : { opacity: 0.7, scale: 1 }}
                transition={{
                    type: 'timing',
                    duration: 2000,
                    easing: Easing.out(Easing.ease),
                    delay: index * 400,
                    repeatReverse: false,
                    loop: animateRipple,
                }}
                key={index}
                style={[StyleSheet.absoluteFillObject, styles.dot]}
                />
            ))}

            {/* Gradient circle */}
            <Svg height={BUTTON_SIZE} width={BUTTON_SIZE}>
                <Defs>
                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#6baccd" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#0c5197" stopOpacity="1" />
                </LinearGradient>
                </Defs>

                <Rect
                x="0"
                y="0"
                width={BUTTON_SIZE}
                height={BUTTON_SIZE}
                rx={BUTTON_SIZE / 2}
                fill="url(#grad)"
                />
            </Svg>

            {/* Icon overlay */}
            <View style={styles.iconWrapper}>
                <Icons.LockIcon size={32} color="white" weight="bold" />
            </View>
            </View>
        </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#6baccd',
  },
  iconWrapper: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white', // needed for Android shadow
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 7,
    // Android shadow
    elevation: 8,
  }
});

export default GradientButton;