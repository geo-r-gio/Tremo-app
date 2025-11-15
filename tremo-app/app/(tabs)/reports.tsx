// New React Native screen based on the provided UI design
// Uses React Native + Expo
// Replace your existing `reports.tsx` with this file

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import { generatePDFReport } from '../../utils/pdfReport';
import { colors } from '@/constants/theme';

export default function ReportsScreen() {
  const [avgPeakData, setAvgPeakData] = useState([
    { value: 4.8, label: 'Mon' },
    { value: 5.6, label: 'Tue' },
    { value: 5.2, label: 'Wed' },
    { value: 6.1, label: 'Thu' },
    { value: 4.5, label: 'Fri' },
    { value: 5.3, label: 'Sat' },
    { value: 5.7, label: 'Sun' },
  ]);

  const weeklySummary = {
    avgSuppressionFreq: 115,
    effectiveSessions: '4/5',
  };

  const monthlySummary = {
    activeSuppressionTime: 3.2,
    tremorShiftFrom: 9.4,
    tremorShiftTo: 8.1,
  };

  const handleDownloadReport = async () => {
    await generatePDFReport({ tremorData: avgPeakData, frequencyData: [], sessions: [] });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Spectral Power Graph */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Average Peak Suppression Tremor</Text>
        <LineChart
          data={avgPeakData}
          curved
          hideDataPoints={false}
          dataPointsColor={'#2D9CDB'}
          dataPointsWidth={8}
          dataPointsHeight={8}
          thickness={3}
          color={'#27AE60'}
          hideRules
          areaChart
          startFillColor={'#6FCF97'}
          endFillColor={'#6FCF9700'}
          startOpacity={0.6}
          endOpacity={0.1}
          spacing={35}
          yAxisTextStyle={{ color: '#7D7D7D' }}
          xAxisLabelTextStyle={{ color: '#7D7D7D' }}
          pointerConfig={{
            pointerStripHeight: 160,
            pointerStripColor: 'lightgray',
            pointerStripWidth: 2,
            pointerColor: 'lightgray',
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: false,
            pointerLabelComponent: (items: {value: number; date?: String; label?: string}[]) => {
              return (
                <View
                  style={{
                    height: 90,
                    width: 100,
                    justifyContent: 'center',
                    marginTop: -30,
                    marginLeft: -40,
                  }}>
                  <Text style={{color: 'white', fontSize: 14, marginBottom:6,textAlign:'center'}}>
                    {items[0].date}
                  </Text>
  
                  <View style={{paddingHorizontal:14,paddingVertical:6, borderRadius:16, backgroundColor:'white'}}>
                    <Text style={{fontWeight: 'bold',textAlign:'center'}}>
                      {items[0].value + ' Hz'}
                    </Text>
                  </View>
                </View>
              );
            },
          }}
        />
      </View>

      {/* Weekly Summary */}
      <Text style={styles.sectionTitle}>Weekly summary</Text>
      <View style={styles.row}> 
        <View style={styles.summaryCard}> 
          <Text style={styles.summaryLabel}>Avg. Suppression Frequency</Text>
          <View style={styles.summaryRow2}>
            <Text style={styles.summaryValue1}>{weeklySummary.avgSuppressionFreq} </Text>
            <Text style={styles.summaryNote}>Hz</Text>
          </View>
        </View>
        <View style={styles.summaryCard}> 
          <Text style={styles.summaryLabel}>Effective Sessions</Text>
          <View style={styles.summaryRow3}>
            <Text style={styles.summaryValue2}>{weeklySummary.effectiveSessions}</Text>
            <Text style={styles.summaryNote}>with {'>'} 30% tremor reduction</Text>
          </View>
        </View>
      </View>

      {/* Monthly Summary */}
      <Text style={styles.sectionTitle}>Monthly summary</Text>
      <View style={styles.row}> 
        <View style={styles.summaryCard}> 
          <Text style={styles.summaryLabel}>Active Suppression Time</Text>
          <View style={styles.summaryRow2}>
            <Text style={styles.summaryValue1}>{monthlySummary.activeSuppressionTime} </Text>
            <Text style={styles.summaryNote}>hours</Text>
          </View>
        </View>
        <View style={styles.summaryCard}> 
          <Text style={styles.summaryLabel}>Tremor Frequency Shift</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryValue2}>↓ </Text>
            <Text style={styles.summaryNote}>from {monthlySummary.tremorShiftFrom} Hz to {monthlySummary.tremorShiftTo} Hz</Text>
          </View>
        </View>
      </View>

      {/* Download Report Button */}
      <Text style={styles.sectionTitle}>Share your report</Text>
      <Pressable style={styles.downloadBtn} onPress={handleDownloadReport}>
        <Feather name="download" size={22} color="white" />
        <Text style={styles.downloadText}>Download report</Text>
      </Pressable>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 40
  },
  chartCard: {
    backgroundColor: '#F7F9FC',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    marginTop: 30
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  summaryCard: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#F0F4FF',
    padding: 18,
    borderRadius: 18,
    marginHorizontal: 5,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6F6F6F',
    marginBottom: 6,
  },
  summaryValue1: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E45403'
  },
  summaryValue2: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00AD07'
  },
  summaryNote: {
    fontSize: 11,
    color: '#4F4F4F',
    flexShrink: 1
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  summaryRow2: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4
  },
  summaryRow3: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4
  },
  downloadBtn: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 50,
    gap: 10,
  },
  downloadText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});




// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'

// const reports = () => {
//   return (
//     <View style={styles.container}>
//       <Text>reports</Text>
//     </View>
//   )
// }

// export default reports

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center'
//     }
// })