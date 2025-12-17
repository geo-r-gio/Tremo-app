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

  const handleButtonPress = async () => {
    setSessionActive(prev => {
      const newState = !prev;

      // When turning ON -> reset duration
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
