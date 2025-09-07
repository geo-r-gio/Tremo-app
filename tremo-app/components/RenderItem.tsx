import { StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import React from 'react'
import { OnboardingData } from '@/data/onboarding'
import LottieView from 'lottie-react-native';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

type Props = {
    item: OnboardingData;
    index: number;
    x: SharedValue<number>
}

const RenderItem = ({item, index, x}: Props) => {
    const {width: SCREEN_WIDTH} = useWindowDimensions();

    const lottieAnimationStyle = useAnimatedStyle(() => {
        const translateYAnimation = interpolate(
            x.value,
            [
                (index - 1) * SCREEN_WIDTH,         //reference point to left of current element's position
                index * SCREEN_WIDTH,               //reference point to center of current element's position
                (index + 1) * SCREEN_WIDTH,         //reference point to right of current element's position
            ],
            [200, 0, -200],
            "clamp"
        );
        return {
            transform: [{translateY: translateYAnimation}]
        }
    })

    const circleAnimation = useAnimatedStyle(() => {
        const scale = interpolate(
            x.value,
            [
                (index - 1) * SCREEN_WIDTH,         //reference point to left of current element's position
                index * SCREEN_WIDTH,               //reference point to center of current element's position
                (index + 1) * SCREEN_WIDTH,         //reference point to right of current element's position
            ],
            [1, 4, 4],
            "clamp"
        );
        return {
            transform: [{scale: scale}]
        }
    })

    return (
        <View style={[styles.itemContainer, {width: SCREEN_WIDTH}]}>
            <View style={styles.circleContainer}>
                <Animated.View
                    style={[{
                        width: SCREEN_WIDTH, 
                        height: SCREEN_WIDTH, 
                        backgroundColor: item.backgroundColor,
                        borderRadius: SCREEN_WIDTH / 2
                    },
                    circleAnimation,
                    ]}/>
            </View>
            <Animated.View style={lottieAnimationStyle}>
                <LottieView
                    source={item.animation} 
                    style={{
                        width: index === 0 ? SCREEN_WIDTH * 1.2 : SCREEN_WIDTH * 0.9, 
                        height: index === 0 ? SCREEN_WIDTH * 1.2 : SCREEN_WIDTH * 0.9,
                        marginTop: index === 0 ? -90 : 0,
                    }}
                    autoPlay
                    loop
                />
            </Animated.View>  
            <Text style={[styles.itemText, {color: item.textColor}]}>{item.text}</Text>
        </View>
    )
}

export default RenderItem

const styles = StyleSheet.create({
    itemContainer: {
        flex: 1,
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 140,
    },
    itemText: {
        textAlign: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        marginHorizontal: 20,
    },
    circleContainer: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'flex-end'
    }
})