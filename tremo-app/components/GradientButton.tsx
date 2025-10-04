// GradientButton.tsx
import React, { useCallback, useState } from "react";
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
};

const Ripple = ({ sv, delay = 0 }: { sv: Animated.SharedValue<number>; delay?: number }) => {
  const style = useAnimatedStyle(() => {
    const s = interpolate(sv.value, [0, 1], [1, 2]);
    const o = interpolate(sv.value, [0, 0.6, 1], [0.7, 0.15, 0]);
    return {
      transform: [{ scale: s }],
      opacity: o,
    };
  });
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.dot, style]} />;
};

const GradientButton: React.FC<Props> = ({ onToggle }) => {
  const [active, setActive] = useState(false);

  // three ripples
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const r3 = useSharedValue(0);

  const startRipples = useCallback(() => {
    // start looping animations — withRepeat wraps the timing animation
    r1.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
    r2.value = withDelay(300, withRepeat(withTiming(1, { duration: 2000 }), -1, false));
    r3.value = withDelay(600, withRepeat(withTiming(1, { duration: 2000 }), -1, false));
  }, [r1, r2, r3]);

  const stopRipples = useCallback(() => {
    r1.value = withTiming(0, { duration: 1000 });
    r2.value = withDelay(200, withTiming(0, { duration: 1000 }));
    r3.value = withDelay(400, withTiming(0, { duration: 1000 }));
  }, [r1, r2, r3]);

  const handlePress = () => {
    const next = !active;
    setActive(next);

    if (next) startRipples();
    else stopRipples();

    // call parent's callback (no if statement needed)
    onToggle?.();
  };

  return (
    <Pressable onPress={handlePress} style={styles.buttonWrapper}>
      <View style={styles.shadowWrapper}>
        <View style={styles.buttonContainer}>
          {/* Ripples (behind the circle). They are animated Reanimated Views */}
          <Ripple sv={r1} />
          <Ripple sv={r2} />
          <Ripple sv={r3} />

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
    backgroundColor: "white", // for Android shadow
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    // Android elevation
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
    // keep the dot behind the gradient circle visually (lower zIndex),
    // but we use order in JSX (ripples before Svg) so circle overlays them.
  },
  iconWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GradientButton;



// import React, { useState } from 'react';
// import { StyleSheet, Pressable, View } from 'react-native';
// import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
// import { MotiView } from 'moti';
// import { Easing, withTiming } from 'react-native-reanimated';
// import * as Icons from 'phosphor-react-native';

// const BUTTON_SIZE = 160;
// interface GradientButtonProps {
//   onToggle?: () => void; // optional onPress prop
// }

// const GradientButton: React.FC<GradientButtonProps> = ({ onToggle }) => {
//     const [animateRipple, setAnimateRipple] = useState(false);

//     const handlePress = () => {
//         setAnimateRipple(prev => !prev);
//         // if (onPress) onPress();
//     };

//   return (
//     <Pressable onPress={() => {
//       handlePress();
//       onToggle?.();
//       // onPress?.();
//     }} style={styles.buttonWrapper}>
//         <View style={styles.shadowWrapper}>
//             <View style={styles.buttonContainer}>
//             {/* Ripple / animated background */}
//             {[...Array(3).keys()].map(index => (
//                 <MotiView
//                 from={{ opacity: 0.7, scale: 1 }}
//                 animate={animateRipple ? { opacity: 0, scale: 2 } : { opacity: 0.7, scale: 1 }}
//                 transition={{
//                     type: 'timing',
//                     duration: 2000,
//                     easing: Easing.out(Easing.ease),
//                     delay: index * 400,
//                     repeatReverse: false,
//                     loop: animateRipple,
//                 }}
//                 key={index}
//                 style={[StyleSheet.absoluteFillObject, styles.dot]}
//                 />
//             ))}

//             {/* Gradient circle */}
//             <Svg height={BUTTON_SIZE} width={BUTTON_SIZE}>
//                 <Defs>
//                 <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
//                     <Stop offset="0%" stopColor="#6baccd" stopOpacity="1" />
//                     <Stop offset="100%" stopColor="#0c5197" stopOpacity="1" />
//                 </LinearGradient>
//                 </Defs>

//                 <Rect
//                 x="0"
//                 y="0"
//                 width={BUTTON_SIZE}
//                 height={BUTTON_SIZE}
//                 rx={BUTTON_SIZE / 2}
//                 fill="url(#grad)"
//                 />
//             </Svg>

//             {/* Icon overlay */}
//             <View style={styles.iconWrapper}>
//                 <Icons.PowerIcon size={34} color="white" weight="bold" />
//             </View>
//             </View>
//         </View>
//     </Pressable>
//   );
// };

// const styles = StyleSheet.create({
//   buttonWrapper: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonContainer: {
//     width: BUTTON_SIZE,
//     height: BUTTON_SIZE,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   dot: {
//     width: BUTTON_SIZE,
//     height: BUTTON_SIZE,
//     borderRadius: BUTTON_SIZE / 2,
//     backgroundColor: '#6baccd',
//   },
//   iconWrapper: {
//     position: 'absolute',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   shadowWrapper: {
//     width: BUTTON_SIZE,
//     height: BUTTON_SIZE,
//     borderRadius: BUTTON_SIZE / 2,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: 'white', // needed for Android shadow
//     // iOS shadow
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.4,
//     shadowRadius: 7,
//     // Android shadow
//     elevation: 8,
//   }
// });

// export default GradientButton;