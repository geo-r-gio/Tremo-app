import React from 'react';
import { StyleSheet, View } from 'react-native';
import GradientButton from '../../components/GradientButton';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        {/* Component centered at top */}
        <View style={styles.topButtonContainer}>
          <GradientButton />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d7d7d7ba',
  },
  topContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomLeftRadius: 30,  
    borderBottomRightRadius: 30,
    overflow: 'hidden', 
    marginBottom: 150,
  },
  topButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 240, // spacing from top
    marginBottom: 150,
  },
});

export default HomeScreen;




// import React, { useRef } from 'react';
// import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
// import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
// import GradientButton from '../../components/GradientButton';
// import RadialVariant from '../../components/RadialVariant';
// import Pagination from '../../components/Pagination';

// const { width } = Dimensions.get('window');

// const Index = () => {
//   const x = useSharedValue(0);
//   const flatListRef = useRef<FlatList>(null);

//   const data = [
//     { key: '1', component: <GradientButton /> },
//     { key: '2', component: <RadialVariant /> },
//   ];

//   const onScroll = useAnimatedScrollHandler({
//     onScroll: (event) => {
//       x.value = event.contentOffset.x;
//     },
//   });

//   return (
//    <View style={styles.container}>
//     <View style={styles.topContainer}>
//       <Animated.FlatList
//         ref={flatListRef}
//         data={data}
//         keyExtractor={(item) => item.key}
//         renderItem={({ item }) => (
//           <View style={[styles.page, { width }]}>
//             <View style={styles.columnContainer}>
//               {/* Component centered at top */}
//               <View style={styles.topButtonContainer}>{item.component}</View>              
//             </View>
//           </View>
//         )}
//         horizontal
//         pagingEnabled
//         showsHorizontalScrollIndicator={false}
//         bounces={false}
//         onScroll={onScroll}
//         scrollEventThrottle={16}
//       />
//       <View style={styles.paginationWrapper}>
//         <Pagination length={data.length} x={x} />
//       </View>
//     </View>
//    </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#d7d7d7ba',
//   },
//   page: {
//     flex: 1,
//     justifyContent: 'flex-start', // top-aligned
//     alignItems: 'center',
//   },
//   topContainer: {
//     backgroundColor: '#fff', // top color
//     alignItems: 'center',
//     borderBottomLeftRadius: 30,  // rounded edges at bottom
//     borderBottomRightRadius: 30,
//     overflow: 'hidden', 
//     marginBottom: 150
//   },
//   columnContainer: {
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     marginTop: 240, // spacing from top of the screen
//   },
//   topButtonContainer: {
//     width: '100%',
//     alignItems: 'center',
//     marginBottom: 150, // spacing between component and pagination
//   },
//   paginationWrapper: {
//     // position: 'absolute',
//     left: 0,
//     right: 0,
//     alignItems: 'center',
//     // bottom: 450
//   }
// });

// export default Index;