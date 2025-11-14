import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Switch, Alert } from "react-native";
import GradientButton from "../../components/GradientButton";
import { bleManager } from "@/constants/bleManager";
import { useBLE } from "@/context/BLEContext";
import base64 from 'react-native-base64';
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";

const ARDUINO_NAME = "Arduino";

const HomeScreen = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [battery, setBattery] = useState(100);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  // const [device, setDevice] = useState<any>(null);

  const { device, setDevice, bleManager, connected, setConnected } = useBLE();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;

    if (sessionActive) {
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
        setBattery((prev) => (prev > 0 ? prev - 0.1 : 0));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionActive]);

  // const handleButtonPress = () => {
  //   setSessionActive((prev) => !prev);
  //   if (!sessionActive) setDuration(0);
  // };

  // const handleButtonPress = async () => {
  //   setSessionActive(prev => !prev);
  //   if (!sessionActive) setDuration(0);

  //   if (!device) return;

  //   const msg = sessionActive ? "Button connection lost" : "Button connection secured";
  //   const base64Value = base64.encode(msg);

  //   try {
  //     // Wait a short moment to ensure services are ready
  //     await device.discoverAllServicesAndCharacteristics();
  //     await new Promise(res => setTimeout(res, 500));

  //     // Directly write to known service/characteristic
  //     await device.writeCharacteristicWithResponseForService(
  //       "12345678-1234-1234-1234-1234567890ab",
  //       "87654321-4321-4321-4321-abcdefabcdef",
  //       base64Value
  //     );

  //     console.log("Message sent to Arduino:", msg);

  //   } catch (err) {
  //     console.error("Failed to send message to Arduino:", err);
  //   }
  // };

  const handleButtonPress = async () => {
    // setSessionActive(prev => !prev);
    setSessionActive(prev => {
      const newState = !prev;

      // When turning ON → reset duration
      if (newState) {
        setDuration(0);
      }

      return newState;
    });

    if (!device) return;

    const msg = sessionActive ? "STOP" : "START"; // Toggle start/stop ML
    const base64Value = base64.encode(msg);

    try {
      await device.discoverAllServicesAndCharacteristics();
      await new Promise(res => setTimeout(res, 300));

      await device.writeCharacteristicWithResponseForService(
        "12345678-1234-1234-1234-1234567890ab",
        "87654321-4321-4321-4321-abcdefabcdef",
        base64Value
      );

      console.log("Sent to Arduino:", msg);
    } catch (err) {
      console.error("Failed to send message to Arduino:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };


  const handleBluetoothToggle = async (value: boolean) => {
    setConnected(value);
    setBluetoothConnected(value);

    if (value) {
      console.log("Scanning for Arduino...");
      bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {
        if (error) return console.error(error);

        if (scannedDevice?.name === ARDUINO_NAME) {
          console.log("Arduino found!");
          bleManager.stopDeviceScan();
          const connectedDevice = await scannedDevice.connect();
          setDevice(connectedDevice);
          setConnected(true);
          Alert.alert("Connected", "Successfully connected to Arduino Nano 33 BLE Sense Rev2!");
        }
      });

      setTimeout(() => bleManager.stopDeviceScan(), 10000);
    } else {
      if (device) {
        await device.cancelConnection();
        setDevice(null);
        setConnected(false);
        Alert.alert("Disconnected", "Bluetooth disconnected from Arduino.");
      }
    }
  };

  useEffect(() => {
    if (!device) return;

    let isMounted = true;

    const setup = async () => {
      try {
        console.log("Waiting for BLE services...");

        const connectedDevice = await device.discoverAllServicesAndCharacteristics();

        if (!isMounted) return;

        console.log("Setting up ML state listener...");

        const subscription = connectedDevice.monitorCharacteristicForService(
          "12345678-1234-1234-1234-1234567890ab",
          "99999999-1111-2222-3333-444444444444",
          (error, characteristic) => {
            if (error) {
              console.log("Monitor error:", error);
              return;
            }

            if (!characteristic?.value) return;

            const msg = base64.decode(characteristic.value);
            console.log("Received from Arduino:", msg);

            if (msg.startsWith("ML:")) {
              const isActive = msg.endsWith("1");
              setSessionActive(isActive);
            }
          }
        );

        // Clean up on unmount
        return () => {
          subscription?.remove();
        };

      } catch (err) {
        console.log("BLE setup error:", err);
      }
    };

    setup();

    return () => {
      isMounted = false;
    };
  }, [device]);

  // const handleBluetoothToggle = async (value: boolean) => {
  //   setBluetoothConnected(value);

  //   if (value) {
  //     try{
  //       console.log("Scanning for Arduino...");
  //       bleManager.startDeviceScan(null, null, async (error, scannedDevice) => {
  //         if (error) {
  //           console.error(error);
  //           return;
  //         }

  //         if (scannedDevice?.name === ARDUINO_NAME) {
  //           console.log("Arduino found!");
  //           bleManager.stopDeviceScan();

  //           const connectedDevice = await scannedDevice.connect();
  //           setDevice(connectedDevice);
  //           Alert.alert("Connected", "Successfully connected to Arduino Nano 33 BLE Sense Rev2!");
  //         }
  //       });

  //       // Stop scanning after 10s
  //       setTimeout(() => bleManager.stopDeviceScan(), 10000);
  //     } catch(err){
  //       console.error("Connection error: ", err);
  //     }
  //   } else {
  //     if (device) {
  //       await device.cancelConnection();
  //       setDevice(null);
  //       Alert.alert("Disconnected", "Bluetooth disconnected from Arduino.");
  //     }
  //   }
  // };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Automatic Stabilization</Text>

      <GradientButton active={sessionActive} onToggle={handleButtonPress} />

      {/* Cards */}
      <View style={styles.cardsContainer}>
        <View style={styles.card}>
          <Ionicons name="timer-outline" size={24} color="#000" />
          <Text style={styles.cardTitle}>Duration</Text>
          <Text style={styles.cardValue}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.card}>
          <Ionicons name="battery-half-outline" size={24} color="#000" />
          <Text style={styles.cardTitle}>Battery</Text>
          <Text style={styles.cardValue}>{battery.toFixed(0)}%</Text>
        </View>
      </View>

      {/* Bluetooth Switch */}
      <View style={styles.bluetoothContainer}>
        <Text style={styles.bluetoothLabel}>Connect to Bluetooth</Text>
        <Switch
          value={connected}
          onValueChange={handleBluetoothToggle}
          trackColor={{ false: "#ccc", true: "#34C759" }}
          thumbColor="#fff"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 40
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: -60
  },
  centerTextContainer: {
    position: "absolute",
    alignItems: "center",
  },
  timerText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },
  subText: {
    fontSize: 14,
    color: "#fff",
    marginTop: 2,
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: -50,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginTop: 4,
  },
  bluetoothContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "75%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  bluetoothLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
});

export default HomeScreen;



// import React, { useState, useEffect } from "react";
// import { StyleSheet, View, Text, ScrollView } from "react-native";
// import GradientButton from "../../components/GradientButton";
// import { colors } from "@/constants/theme";
// import { Ionicons } from "@expo/vector-icons";

// const HomeScreen = () => {
//   const [sessionActive, setSessionActive] = useState(false);
//   const [duration, setDuration] = useState(0); // in seconds
//   const [battery, setBattery] = useState(100); // mock battery percentage

//   useEffect(() => {
//     let timer: ReturnType<typeof setInterval> | undefined;

//     if (sessionActive) {
//       timer = setInterval(() => {
//         setDuration((prev) => prev + 1);
//         setBattery((prev) => (prev > 0 ? prev - 0.1 : 0));
//       }, 1000);
//     }

//     return () => {
//       if (timer) clearInterval(timer);
//     };
//   }, [sessionActive]);

//   const handleButtonPress = () => {
//     setSessionActive((prev) => !prev);
//     if (!sessionActive) setDuration(0);
//   };

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, "0")}:${secs
//       .toString()
//       .padStart(2, "0")}`;
//   };

//   return (
//     <View style={styles.container}>
//       {/* Top Container */}
//       <View style={styles.topContainer}>
//         <Text style={styles.title}>Automatic Vibration Adjustments</Text>

//         <View style={styles.topButtonContainer}>
//           <GradientButton onToggle={handleButtonPress} />
//         </View>
//       </View>

//       {/* Bottom Cards */}
//       <ScrollView
//         contentContainerStyle={styles.bottomContainer}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Session Duration Card */}
//         <View style={[styles.card, { backgroundColor: colors.peach }]}>
//           <View style={styles.cardContent}>
//             <Ionicons name="time-outline" size={32} color={colors.white} />
//             <Text style={styles.cardTitle}>Session Duration</Text>
//           </View>
//           <Text style={styles.cardValue}>{formatTime(duration)}</Text>
//         </View>

//         {/* Battery Life Card */}
//         <View style={[styles.card, { backgroundColor: colors.mint }]}>
//           <View style={styles.cardContent}>
//             <Ionicons name="battery-half-outline" size={32} color={colors.white} />
//             <Text style={styles.cardTitle}>Battery Life</Text>
//           </View>
//           <Text style={styles.cardValue}>{battery.toFixed(0)}%</Text>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#d7d7d7ba",
//   },
//   topContainer: {
//     backgroundColor: "#fff",
//     alignItems: "center",
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     overflow: "hidden",
//     borderWidth: 1.5
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginTop: 85,
//     color: colors.textDark,
//   },
//   topButtonContainer: {
//     width: "100%",
//     alignItems: "center",
//     marginTop: 80,
//     marginBottom: 80,
//   },
//   bottomContainer: {
//     flexGrow: 1,
//     alignItems: "center",
//     justifyContent: "flex-start",
//     paddingTop: 40,
//     gap: 20,
//     paddingBottom: 40,
//   },
//   card: {
//     width: "88%",
//     height: "25%",
//     borderRadius: 18,
//     paddingVertical: 20,
//     paddingHorizontal: 24,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     // Shadows
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 4,
//     borderWidth: 1.5,
//   },
//   cardContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 12,
//   },
//   cardTitle: {
//     fontSize: 17,
//     fontWeight: "600",
//     color: colors.white,
//   },
//   cardValue: {
//     fontSize: 22,
//     fontWeight: "bold",
//     color: colors.white,
//   },
// });

// export default HomeScreen;



// import React, { useState, useEffect } from 'react';
// import { StyleSheet, View, Text, ScrollView } from 'react-native';
// import GradientButton from '../../components/GradientButton';
// import { colors } from '@/constants/theme';

// const HomeScreen = () => {
//   const [sessionActive, setSessionActive] = useState(false);
//   const [duration, setDuration] = useState(0); // in seconds
//   const [battery, setBattery] = useState(100); // just a mock battery percentage

//   // Timer for session duration
//   useEffect(() => {
//     let timer: number | undefined;

//     if (sessionActive) {
//         timer = setInterval(() => {
//         setDuration(prev => prev + 1);
//         setBattery(prev => (prev > 0 ? prev - 0.1 : 0));
//         }, 1000);
//     }

//     return () => {
//         if (timer !== undefined) {
//         clearInterval(timer);
//         }
//     };
//   }, [sessionActive]);

//   const handleButtonPress = () => {
//     setSessionActive(prev => !prev);
//     if (!sessionActive) setDuration(0); // reset duration on start if desired
//   };

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, '0')}:${secs
//       .toString()
//       .padStart(2, '0')}`;
//   };

//   return (
//     <View style={styles.container}>
//       {/* Top Container */}
//       <View style={styles.topContainer}>
//         <Text style={styles.title}>Automatic Vibration Adjustments</Text>

//         <View style={styles.topButtonContainer}>
//           <GradientButton onToggle={handleButtonPress} />
//         </View>
//       </View>

//       {/* Bottom Cards */}
//       <ScrollView 
//         contentContainerStyle={styles.bottomContainer} 
//         showsVerticalScrollIndicator={false}
//       >
//         {/* <View style={styles.bottomContainer}> */}
//             <View style={styles.card}>
//                 <Text style={styles.cardTitle}>Session Duration</Text>
//                 <Text style={styles.cardValue}>{formatTime(duration)}</Text>
//             </View>

//             <View style={styles.card}>
//                 <Text style={styles.cardTitle}>Battery Life</Text>
//                 <Text style={styles.cardValue}>{battery.toFixed(0)}%</Text>
//             </View>
//         {/* </View> */}

//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#d7d7d7ba',
//   },
//   topContainer: {
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     overflow: 'hidden',
//     // paddingBottom: 40,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginTop: 85,
//     color: colors.textDark,
//   },
//   topButtonContainer: {
//     width: '100%',
//     alignItems: 'center',
//     marginTop: 80,
//     marginBottom: 80,
//   },
//   bottomContainer: {
//     flexGrow: 1,
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     paddingTop: 40,
//     gap: 20,
//     paddingBottom: 40
//   },
//   card: {
//     width: '85%',
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 20,
//     alignItems: 'center',
//     // shadow for iOS
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 5 },
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     // elevation for Android
//     elevation: 5,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.textDark,
//     marginBottom: 10,
//   },
//   cardValue: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: colors.primary,
//   },
// });

// export default HomeScreen;





// // import React from 'react';
// // import { StyleSheet, View, Text } from 'react-native';
// // import GradientButton from '../../components/GradientButton';
// // import { colors } from '@/constants/theme';

// // const HomeScreen = () => {
// //   return (
// //     <View style={styles.container}>
// //       <View style={styles.topContainer}>
// //         <Text style={styles.title}>Automatic Vibration Adjustments</Text>

// //         <View style={styles.topButtonContainer}>
// //           <GradientButton />
// //         </View>
// //       </View>
// //     </View>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: '#d7d7d7ba',
// //   },
// //   topContainer: {
// //     backgroundColor: '#fff',
// //     alignItems: 'center',
// //     borderBottomLeftRadius: 30,  
// //     borderBottomRightRadius: 30,
// //     overflow: 'hidden', 
// //     // marginBottom: 150,
// //   },
// //   title: {
// //     fontSize: 22,
// //     fontWeight: 'bold',
// //     marginTop: 85,
// //     color: colors.textDark
// //   },
// //   topButtonContainer: {
// //     width: '100%',
// //     alignItems: 'center',
// //     marginTop: 150, // spacing from top
// //     marginBottom: 160,
// //   }
// // });

// // export default HomeScreen;