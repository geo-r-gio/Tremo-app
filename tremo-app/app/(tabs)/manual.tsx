import React from 'react';
import { StyleSheet, View } from 'react-native';
import RadialVariant from '../../components/RadialVariant';

const ManualScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        {/* Component centered at top */}
        <View style={styles.topButtonContainer}>
          <RadialVariant />
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

export default ManualScreen;