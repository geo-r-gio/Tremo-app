// app/(tabs)/reports.tsx
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import base64 from 'react-native-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePDFReport } from '../../utils/pdfReport';
import { colors } from '@/constants/theme';
import { useBLE } from '@/context/BLEContext';

// -----------------------------
// Types
// -----------------------------
type TremorSession = {
  id: string;
  date: string; // ISO date string (yyyy-mm-dd)
  mode: string;
  duration: number; // seconds
  before: number;
  after: number;
  reduction: number;
  avgFrequency: number;
};

type PeakDataPoint = { value: number; label: string; date?: string };

// BLE UUIDs (change to your real values)
const CONTROL_SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const STATE_CHAR_UUID = '99999999-1111-2222-3333-444444444444';

const generateUniqueId = () => Math.random().toString(36).slice(2, 11);

// -----------------------------
// Component
// -----------------------------
export default function ReportsScreen() {
  const { device } = useBLE();

  // persisted state
  const [sessions, setSessions] = useState<TremorSession[]>([]);
  const [avgPeakData, setAvgPeakData] = useState<PeakDataPoint[]>([]);

  // live state
  const [livePoints, setLivePoints] = useState<PeakDataPoint[]>([]);

  // refs for in-progress session + freqs buffer
  const currentSessionRef = useRef<TremorSession | null>(null);
  const tremorFreqsRef = useRef<number[]>([]);
  const subscriptionRef = useRef<any>(null);

  // summaries
  const [weeklySummary, setWeeklySummary] = useState({ avgSuppressionFreq: 0, effectiveSessions: '0/0' });
  const [monthlySummary, setMonthlySummary] = useState({ activeSuppressionTime: 0, tremorShiftFrom: 0, tremorShiftTo: 0 });

  // helper: day abbreviation
  const getDayAbbreviation = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return '';
    }
  };

  // persist helpers
  const persistSessions = useCallback(async (arr: TremorSession[]) => {
    try {
      await AsyncStorage.setItem('sessions', JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to persist sessions', e);
    }
  }, []);

  const persistAvgPeaks = useCallback(async (arr: PeakDataPoint[]) => {
    try {
      await AsyncStorage.setItem('avgPeakData', JSON.stringify(arr));
    } catch (e) {
      console.warn('Failed to persist avgPeakData', e);
    }
  }, []);

  // combined chart data (past averages first, then live)
  const chartData = useMemo(() => [...avgPeakData, ...livePoints], [avgPeakData, livePoints]);

  // ----------------------------------------
  // Load persisted data on mount
  // ----------------------------------------
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('sessions');
        const savedAvgPeaks = await AsyncStorage.getItem('avgPeakData');

        if (!mounted) return;

        if (savedSessions) setSessions(JSON.parse(savedSessions));
        if (savedAvgPeaks) setAvgPeakData(JSON.parse(savedAvgPeaks));
      } catch (e) {
        console.warn('Failed to load persisted data', e);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // persist when sessions or avgPeakData change (non-blocking)
  useEffect(() => {
    persistSessions(sessions);
  }, [sessions, persistSessions]);

  useEffect(() => {
    persistAvgPeaks(avgPeakData);
  }, [avgPeakData, persistAvgPeaks]);

  // -----------------------------
  // BLE monitor setup (DISCOVER -> MONITOR)
  // -----------------------------
  useEffect(() => {
    // cleanup previous subscription
    const cleanup = () => {
      try {
        subscriptionRef.current?.remove?.();
        subscriptionRef.current = null;
      } catch {}
    };
    cleanup();

    if (!device) return cleanup;

    let mounted = true;

    const setup = async () => {
      try {
        console.log('[BLE] Discovering services & characteristics...');
        // this is required before monitoring
        await device.discoverAllServicesAndCharacteristics();
        if (!mounted) return;
        console.log('[BLE] Discovery complete — subscribing to characteristic...');

        subscriptionRef.current = device.monitorCharacteristicForService(
          CONTROL_SERVICE_UUID,
          STATE_CHAR_UUID,
          (error: any, char: any) => {
            if (error) {
              console.log('[BLE ERROR]', error);
              return;
            }
            if (!char?.value) return;

            const decoded = base64.decode(char.value).trim();
            // debug raw
            console.log('[BLE DECODED]', decoded);

            // ignore non-JSON control lines like "ML:1" here (we still log above)
            if (!decoded.startsWith('{')) {
              // optionally handle "ML:1" notifications if needed
              return;
            }

            let data: any = null;
            try {
              data = JSON.parse(decoded);
            } catch (e) {
              console.warn('[BLE PARSE FAILED]', e, decoded);
              return;
            }

            // START event
            if (data.event === 'START') {
              const newSession: TremorSession = {
                id: generateUniqueId(),
                date: new Date().toISOString().split('T')[0],
                mode: data.mode || 'ML',
                duration: 0,
                before: data.before || 0,
                after: 0,
                reduction: 0,
                avgFrequency: 0,
              };
              currentSessionRef.current = newSession;
              tremorFreqsRef.current = [];
              setLivePoints([]); // fresh live plot
              console.log('[BLE] START received', newSession);
              return;
            }

            // frequency update during session
            if (data.freq !== undefined && currentSessionRef.current) {
              tremorFreqsRef.current = [...tremorFreqsRef.current, Number(data.freq)];
              const point: PeakDataPoint = {
                value: Number(data.freq),
                label: '', // intentionally blank while live
                date: new Date().toLocaleTimeString(),
              };
              // keep last ~20 live points
              setLivePoints(prev => [...prev.slice(-19), point]);
              // debug
              // console.log('[BLE] LIVE freq', data.freq);
              return;
            }

            // STOP event -> finalize session
            if (data.event === 'STOP' && currentSessionRef.current) {
              const freqs = tremorFreqsRef.current;
              const avgFreq = freqs.length ? freqs.reduce((a, b) => a + b, 0) / freqs.length : 0;

              const finishedSession: TremorSession = {
                ...currentSessionRef.current,
                duration: data.duration || 0,
                after: data.after || 0,
                reduction: data.reduction || 0,
                avgFrequency: avgFreq,
              };

              // update sessions + persist
              setSessions(prev => {
                const next = [...prev, finishedSession];
                persistSessions(next);
                return next;
              });

              // append single average point (with day label) and persist
              const dayLabel = getDayAbbreviation(currentSessionRef.current.date);
              setAvgPeakData(prev => {
                const next = [...prev, { value: parseFloat(avgFreq.toFixed(2)), label: dayLabel }];
                persistAvgPeaks(next);
                return next;
              });

              // reset live
              currentSessionRef.current = null;
              tremorFreqsRef.current = [];
              setLivePoints([]);
              console.log('[BLE] STOP received', finishedSession);
              return;
            }
          }
        );

        console.log('[BLE] Monitor active');
      } catch (e) {
        console.warn('[BLE] setup failed', e);
      }
    };

    setup();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [device, persistAvgPeaks, persistSessions]);

  // -----------------------------
  // Weekly & Monthly summary calculation
  // -----------------------------
  useEffect(() => {
    if (!sessions.length) {
      setWeeklySummary({ avgSuppressionFreq: 0, effectiveSessions: '0/0' });
      setMonthlySummary({ activeSuppressionTime: 0, tremorShiftFrom: 0, tremorShiftTo: 0 });
      return;
    }

    const now = new Date();
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);

    const monthStart = new Date();
    monthStart.setMonth(now.getMonth() - 1);

    const weeklySessions = sessions.filter(s => new Date(s.date) >= weekStart);
    const monthlySessions = sessions.filter(s => new Date(s.date) >= monthStart);

    const avgFreq = weeklySessions.length ? weeklySessions.reduce((sum, s) => sum + s.avgFrequency, 0) / weeklySessions.length : 0;
    const effectiveCount = weeklySessions.filter(s => s.reduction > 30).length;

    setWeeklySummary({ avgSuppressionFreq: parseFloat(avgFreq.toFixed(1)), effectiveSessions: `${effectiveCount}/${weeklySessions.length}` });

    const activeTime = monthlySessions.reduce((sum, s) => sum + s.duration, 0) / 3600; // seconds -> hours
    const tremorShiftFrom = monthlySessions.length ? Math.max(...monthlySessions.map(s => s.before)) : 0;
    const tremorShiftTo = monthlySessions.length ? Math.min(...monthlySessions.map(s => s.after)) : 0;

    setMonthlySummary({ activeSuppressionTime: parseFloat(activeTime.toFixed(1)), tremorShiftFrom, tremorShiftTo });
  }, [sessions]);

  // -----------------------------
  // PDF Export
  // -----------------------------
  const handleDownloadReport = async () => {
    await generatePDFReport({
      tremorData: avgPeakData,
      frequencyData: tremorFreqsRef.current.map(v => ({ value: v })),
      sessions: sessions.map(s => ({ ...s, duration: s.duration.toString(), after: s.after, avgFrequency: s.avgFrequency })),
    });
  };
 
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Live Peak Suppression Tremor</Text>
        <LineChart
          data={chartData}
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
            pointerLabelWidth: 120,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: false,
            pointerLabelComponent: (items: { value: number; date?: string; label?: string }[]) => (
              <View style={{ height: 90, width: 120, justifyContent: 'center', marginTop: -30, marginLeft: -40 }}>
                <Text style={{ color: 'white', fontSize: 14, marginBottom: 6, textAlign: 'center' }}>
                  {items[0]?.date ?? items[0]?.label ?? ''}
                </Text>
                <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'white' }}>
                  <Text style={{ fontWeight: 'bold', textAlign: 'center' }}>{items[0]?.value + ' Hz'}</Text>
                </View>
              </View>
            ),
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
            <Text style={styles.summaryNote}>with {'>'} 50% tremor reduction</Text>
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
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 40,
  },
  chartCard: {
    backgroundColor: '#F7F9FC',
    padding: 20,
    borderRadius: 20,
    marginBottom: 30,
    marginTop: 30,
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
    color: '#E45403',
  },
  summaryValue2: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00AD07',
  },
  summaryNote: {
    fontSize: 11,
    color: '#4F4F4F',
    flexShrink: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryRow2: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  summaryRow3: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
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






// import React, { useState } from 'react';
// import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
// import { LineChart, BarChart } from 'react-native-gifted-charts';
// import { Feather } from '@expo/vector-icons';
// import { generatePDFReport } from '../../utils/pdfReport';
// import { colors } from '@/constants/theme';

// export default function ReportsScreen() {
//   const [avgPeakData, setAvgPeakData] = useState([
//     { value: 4.8, label: 'Mon' },
//     { value: 5.6, label: 'Tue' },
//     { value: 5.2, label: 'Wed' },
//     { value: 6.1, label: 'Thu' },
//     { value: 4.5, label: 'Fri' },
//     { value: 5.3, label: 'Sat' },
//     { value: 5.7, label: 'Sun' },
//   ]);

//   const weeklySummary = {
//     avgSuppressionFreq: 115,
//     effectiveSessions: '4/5',
//   };

//   const monthlySummary = {
//     activeSuppressionTime: 3.2,
//     tremorShiftFrom: 9.4,
//     tremorShiftTo: 8.1,
//   };

//   const handleDownloadReport = async () => {
//     await generatePDFReport({ tremorData: avgPeakData, frequencyData: [], sessions: [] });
//   };

//   return (
//     <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
//       <Text style={styles.header}>Dashboard</Text>

//       {/* Spectral Power Graph */}
//       <View style={styles.chartCard}>
//         <Text style={styles.chartTitle}>Average Peak Suppression Tremor</Text>
//         <LineChart
//           data={avgPeakData}
//           curved
//           hideDataPoints={false}
//           dataPointsColor={'#2D9CDB'}
//           dataPointsWidth={8}
//           dataPointsHeight={8}
//           thickness={3}
//           color={'#27AE60'}
//           hideRules
//           areaChart
//           startFillColor={'#6FCF97'}
//           endFillColor={'#6FCF9700'}
//           startOpacity={0.6}
//           endOpacity={0.1}
//           spacing={35}
//           yAxisTextStyle={{ color: '#7D7D7D' }}
//           xAxisLabelTextStyle={{ color: '#7D7D7D' }}
//           pointerConfig={{
//             pointerStripHeight: 160,
//             pointerStripColor: 'lightgray',
//             pointerStripWidth: 2,
//             pointerColor: 'lightgray',
//             radius: 6,
//             pointerLabelWidth: 100,
//             pointerLabelHeight: 90,
//             activatePointersOnLongPress: true,
//             autoAdjustPointerLabelPosition: false,
//             pointerLabelComponent: (items: {value: number; date?: String; label?: string}[]) => {
//               return (
//                 <View
//                   style={{
//                     height: 90,
//                     width: 100,
//                     justifyContent: 'center',
//                     marginTop: -30,
//                     marginLeft: -40,
//                   }}>
//                   <Text style={{color: 'white', fontSize: 14, marginBottom:6,textAlign:'center'}}>
//                     {items[0].date}
//                   </Text>
  
//                   <View style={{paddingHorizontal:14,paddingVertical:6, borderRadius:16, backgroundColor:'white'}}>
//                     <Text style={{fontWeight: 'bold',textAlign:'center'}}>
//                       {items[0].value + ' Hz'}
//                     </Text>
//                   </View>
//                 </View>
//               );
//             },
//           }}
//         />
//       </View>

//       {/* Weekly Summary */}
//       <Text style={styles.sectionTitle}>Weekly summary</Text>
//       <View style={styles.row}> 
//         <View style={styles.summaryCard}> 
//           <Text style={styles.summaryLabel}>Avg. Suppression Frequency</Text>
//           <View style={styles.summaryRow2}>
//             <Text style={styles.summaryValue1}>{weeklySummary.avgSuppressionFreq} </Text>
//             <Text style={styles.summaryNote}>Hz</Text>
//           </View>
//         </View>
//         <View style={styles.summaryCard}> 
//           <Text style={styles.summaryLabel}>Effective Sessions</Text>
//           <View style={styles.summaryRow3}>
//             <Text style={styles.summaryValue2}>{weeklySummary.effectiveSessions}</Text>
//             <Text style={styles.summaryNote}>with {'>'} 30% tremor reduction</Text>
//           </View>
//         </View>
//       </View>

//       {/* Monthly Summary */}
//       <Text style={styles.sectionTitle}>Monthly summary</Text>
//       <View style={styles.row}> 
//         <View style={styles.summaryCard}> 
//           <Text style={styles.summaryLabel}>Active Suppression Time</Text>
//           <View style={styles.summaryRow2}>
//             <Text style={styles.summaryValue1}>{monthlySummary.activeSuppressionTime} </Text>
//             <Text style={styles.summaryNote}>hours</Text>
//           </View>
//         </View>
//         <View style={styles.summaryCard}> 
//           <Text style={styles.summaryLabel}>Tremor Frequency Shift</Text>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryValue2}>↓ </Text>
//             <Text style={styles.summaryNote}>from {monthlySummary.tremorShiftFrom} Hz to {monthlySummary.tremorShiftTo} Hz</Text>
//           </View>
//         </View>
//       </View>

//       {/* Download Report Button */}
//       <Text style={styles.sectionTitle}>Share your report</Text>
//       <Pressable style={styles.downloadBtn} onPress={handleDownloadReport}>
//         <Feather name="download" size={22} color="white" />
//         <Text style={styles.downloadText}>Download report</Text>
//       </Pressable>

//       <View style={{ height: 50 }} />
//     </ScrollView>
//   );
// }