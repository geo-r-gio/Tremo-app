// GradientButton.tsx
import React, { useCallback, useEffect } from "react";
import { StyleSheet, Pressable, View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import * as Icons from "phosphor-react-native";

const BUTTON_SIZE = 200;

type Props = {
  onToggle?: () => void;
  active?: boolean;     // <-- external control from BLE
};

const Ripple = ({ sv }: { sv: Animated.SharedValue<number> }) => {
  const style = useAnimatedStyle(() => {
    const s = interpolate(sv.value, [0, 1], [1, 2]);
    const o = interpolate(sv.value, [0, 0.6, 1], [0.7, 0.15, 0]);
    return {
      transform: [{ scale: s }],
      opacity: o,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, styles.dot, style]}
    />
  );
};

const GradientButton: React.FC<Props> = ({ onToggle, active = false }) => {
  // three ripples
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);

  const startRipples = useCallback(() => {
    r1.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    r2.value = withDelay(300, withRepeat(withTiming(1, { duration: 2000 }), -1, false));
    r3.value = withDelay(600, withRepeat(withTiming(1, { duration: 2000 }), -1, false));
  }, []);

  const stopRipples = useCallback(() => {
    r1.value = withTiming(0, { duration: 500 });
    r2.value = withDelay(150, withTiming(0, { duration: 500 }));
    r3.value = withDelay(300, withTiming(0, { duration: 500 }));
  }, []);

  // Sync animation with BLE state
  useEffect(() => {
    if (active) startRipples();
    else stopRipples();
  }, [active]);

  const handlePress = () => {
    onToggle?.(); // still notify parent when pressed
  };

  return (
    <Pressable onPress={handlePress} style={styles.buttonWrapper}>
      <View style={styles.shadowWrapper}>
        <View style={styles.buttonContainer}>
          <Ripple sv={r1} />
          <Ripple sv={r2} />
          <Ripple sv={r3} />

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

          <View style={styles.iconWrapper}>
            <Icons.PowerIcon size={34} color="white" weight="bold" />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadowWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContainer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#6baccd",
  },
  iconWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GradientButton;
