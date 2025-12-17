import React, { useCallback, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import * as Icons from "phosphor-react-native";
import RadialVariant from "../../components/RadialVariant";
import { LinearGradient } from "expo-linear-gradient";
import base64 from 'react-native-base64';
import { useBLE } from "@/context/BLEContext";
import { colors } from "@/constants/theme";

const vibrationPatterns = [
  { id: 1, icon: "Waves", title: "Gentle Wave", desc: "Smooth, continuous" },
  { id: 2, icon: "Pulse", title: "Pulse", desc: "Rhythmic intervals" },
  { id: 3, icon: "Lightning", title: "Rapid", desc: "Quick bursts" },
  { id: 4, icon: "WaveSine", title: "Alternating", desc: "Variable intensity" },
];

const ManualScreen = () => {
  const [radialIntensity, setRadialIntensity] = useState(0);
  const [selectedPattern, setSelectedPattern] = useState<number | null>(null);
  const [intensity, setIntensity] = useState(3);
  const { device } = useBLE();

  const handleIncrease = () => setIntensity(prev => (prev < 5 ? prev + 1 : prev));
  const handleDecrease = () => setIntensity(prev => (prev > 1 ? prev - 1 : prev));

  const sendBLEMessage = async (message: any) => {
    if (!device) {
      console.log("No BLE device connected");
      return;
    }

    try {
      // Make sure services are discovered
      await device.discoverAllServicesAndCharacteristics();
      await new Promise(res => setTimeout(res, 200)); // tiny delay

      const json = JSON.stringify(message);
      const base64Value = base64.encode(json);

      await device.writeCharacteristicWithResponseForService(
        "12345678-1234-1234-1234-1234567890ab",
        "87654321-4321-4321-4321-abcdefabcdef",
        base64Value
      );

      console.log("Sent:", json);
    } catch (err: any) {
      console.log("BLE write error:", err, err.reason);
    }
  };

  const handleRadialValueChange = useCallback((newVal: number) => {
    const finalVal = Math.round(newVal); 

    setRadialIntensity(finalVal);
  }, []);

  const togglePattern = (id: number) => {
    setSelectedPattern(prev => (prev === id ? null : id));
  };

  const handleApplySettings = async () => {
    // Stop ML if active
    await sendBLEMessage({ mode: "ml", state: "stop" });

    if (selectedPattern === null) {
      // Manual slider mode
      await sendBLEMessage({
        mode: "manual",
        intensity: radialIntensity // value from radial slider
      });
    } else {
      // Pattern mode
      await sendBLEMessage({
        mode: "pattern",
        pattern: selectedPattern,
        level: intensity
      });
    }

    console.log("Settings applied");
  };

  return (
    <View style={styles.container}>
      {/* Top circular component */}
      <View style={styles.topContainer}>
        <Text style={styles.header}>Customize Vibration</Text>
        <View style={styles.topButtonContainer}>
          <RadialVariant 
            value={radialIntensity}
            onValueChange={handleRadialValueChange}
          />
        </View>
      </View>

      {/* Pattern selection */}
      <View style={styles.patternContainer}>
         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <Text style={styles.sectionTitle}>Vibration Patterns</Text>
          <View style={styles.grid}>
            {vibrationPatterns.map(pattern => {
              const IconComponent = (Icons as any)[pattern.icon];
              const isSelected = selectedPattern === pattern.id;
              return (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.card,
                    isSelected && styles.selectedCard,
                  ]}
                  onPress={() => togglePattern(pattern.id)}
                  activeOpacity={0.9}
                >
                  <View
                    style={[
                      styles.iconCircle,
                      isSelected && styles.selectedIconCircle,
                    ]}
                  >
                    <IconComponent
                      size={26}
                      color={isSelected ? "#0c5197" : "#555"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      isSelected && { color: "#111" },
                    ]}
                  >
                    {pattern.title}
                  </Text>
                  <Text style={styles.cardDesc}>{pattern.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Intensity Selector */}
          <View style={styles.intensityCard}>
            <View>
              <Text style={styles.intensityLabel}>Pattern Intensity</Text>
              <Text style={styles.intensityLevel}>Level {intensity} of 5</Text>
            </View>
            <View style={styles.intensityControls}>
              <TouchableOpacity style={styles.intensityButton} onPress={handleDecrease}>
                <Text style={styles.intensityButtonText}>−</Text>
              </TouchableOpacity>

              <View style={styles.intensityBarContainer}>
                <View
                  style={[
                    styles.intensityBar,
                    { width: `${(intensity / 5) * 100}%`, backgroundColor: colors.primaryDark },
                  ]}
                />
              </View>

              <TouchableOpacity style={styles.intensityButton} onPress={handleIncrease}>
                <Text style={styles.intensityButtonText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleApplySettings}
            style={styles.applyButton}
          >
            <Text style={styles.applyText}>Apply Settings</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FB" 
  },
  topContainer: {
    backgroundColor: "#fff",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    marginBottom: 20,
  },
  topButtonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 150,
    marginBottom: 150
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 80
  },
  patternContainer: { paddingHorizontal: 24, flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 10,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  selectedCard: { borderColor: "#0c5197", backgroundColor: "#EEF2FF" },
  iconCircle: { backgroundColor: "#F3F4F6", borderRadius: 50, padding: 10, marginBottom: 8 },
  selectedIconCircle: { backgroundColor: "#E0E7FF" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#333" },
  cardDesc: { fontSize: 13, color: "#888", marginTop: 2 },
  intensityCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
    flexDirection: "column",
    gap: 12,
  },
  intensityLabel: { 
    fontSize: 15, 
    fontWeight: "600", 
    color: "#333" 
  },
  intensityLevel: { 
    fontSize: 13, 
    color: "#777", 
    marginTop: 2 
  },
  intensityControls: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  intensityButton: { 
    backgroundColor: "#F3F4F6", 
    borderRadius: 12, 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  intensityButtonText: { 
    fontSize: 22, 
    fontWeight: "600", 
    color: "#111" 
  },
  intensityBarContainer: { 
    flex: 1, 
    height: 12, 
    backgroundColor: "#E5E7EB", 
    borderRadius: 8, 
    marginHorizontal: 12, 
    overflow: "hidden" 
  },
  intensityBar: { 
    height: "100%", 
    borderRadius: 8 
  },
  applyButton: { 
    backgroundColor: colors.primaryDark,
    borderRadius: 16, 
    paddingVertical: 16, 
    alignItems: "center", 
    marginTop: 24, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 6 
  },
  applyText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
});

export default ManualScreen;
