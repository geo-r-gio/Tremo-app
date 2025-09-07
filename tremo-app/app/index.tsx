import { FlatList, StyleSheet, View, ViewToken } from "react-native";
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import data, { OnboardingData } from '../data/onboarding';
import RenderItem from "@/components/RenderItem";
import Pagination from "@/components/Pagination";
import CustomButton from "@/components/CustomButton";

export default function Index() {
  const flatlistRef = useAnimatedRef<FlatList<OnboardingData>>();
  const x = useSharedValue(0);
  const flatlistIndex = useSharedValue(0);

  const onViewableItemsChanged = ({viewableItems}:{viewableItems: ViewToken[]}) => {
    if(viewableItems[0].index !== null) {
      flatlistIndex.value = viewableItems[0].index;
    }
  }

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      x.value = event.contentOffset.x;
    }
  })

  return (
    <View style={styles.container}>
      <Animated.FlatList 
      ref={flatlistRef}
      onScroll={onScroll}
      data={data}
      renderItem={({item, index}) => {
        return <RenderItem item={item} index={index} x={x} />
      }}
      keyExtractor={item => item.id}
      scrollEventThrottle={16}
      horizontal={true}
      bounces={false}
      pagingEnabled={true}
      showsHorizontalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{
        minimumViewTime: 300,
        viewAreaCoveragePercentThreshold: 10
      }}
      />
      <View style={styles.bottomContainer}>
        <Pagination data={data} x={x}/>
        <CustomButton 
          flatlistRef={flatlistRef}
          flatlistIndex={flatlistIndex}
          dataLength={data.length}
          x={x}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomContainer : {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    marginHorizontal: 30,
    paddingVertical: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});
