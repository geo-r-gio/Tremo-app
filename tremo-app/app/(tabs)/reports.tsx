import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Feather } from '@expo/vector-icons';
import base64 from 'react-native-base64';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generatePDFReport } from '../../utils/pdfReport';
import { colors } from '@/constants/theme';
import { useBLE } from '@/context/BLEContext';
import { saveSessionToFirestore } from "@/utils/firestoreReports";
import { useAuth } from "@/context/authContext";

// Types
type TremorSession = {
  id: string;
  date: string;
  mode: string;
  duration: number;
  before: number;
  after: number;
  reduction: number;
  avgFrequency: number;
};

type PeakDataPoint = { value: number; label: string; date?: string };

// UUIDs
const CONTROL_SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const STATE_CHAR_UUID = '99999999-1111-2222-3333-444444444444';

const generateUniqueId = () => Math.random().toString(36).slice(2, 11);

// Component
export default function ReportsScreen() {
  const { user } = useAuth();
  const { device } = useBLE();

  // persisted state
  const [sessions, setSessions] = useState<TremorSession[]>([]);
  const [avgPeakData, setAvgPeakData] = useState<PeakDataPoint[]>([]);
  const [livePoints, setLivePoints] = useState<PeakDataPoint[]>([]);

  // refs for current session and live data
  const currentSessionRef = useRef<TremorSession | null>(null);
  const tremorFreqsRef = useRef<number[]>([]);
  const subscriptionRef = useRef<any>(null);

  // refs to store latest state for stable BLE handler
  const sessionsRef = useRef<TremorSession[]>([]);
  const avgPeakDataRef = useRef<PeakDataPoint[]>([]);

  // persistence guards
  const hasLoadedRef = useRef(false);
  const [hasLoadedSessions, setHasLoadedSessions] = useState(false);

  // summaries
  const [weeklySummary, setWeeklySummary] = useState({ avgSuppressionFreq: 0, effectiveSessions: '0/0' });
  const [monthlySummary, setMonthlySummary] = useState({ activeSuppressionTime: 0, tremorShiftFrom: 0, tremorShiftTo: 0 });

  // helper: weekday abbreviation
  const getDayAbbreviation = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return '';
    }
  };

  // Persist helpers
  const persistSessions = useCallback(async (arr: TremorSession[]) => {
    try { await AsyncStorage.setItem('sessions', JSON.stringify(arr)); }
    catch (e) { console.warn("Failed to persist sessions", e); }
  }, []);

  const persistAvgPeaks = useCallback(async (arr: PeakDataPoint[]) => {
    try { await AsyncStorage.setItem('avgPeakData', JSON.stringify(arr)); }
    catch (e) { console.warn("Failed to persist avgPeakData", e); }
  }, []);

  // keep refs in sync
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);
  useEffect(() => { avgPeakDataRef.current = avgPeakData; }, [avgPeakData]);

  // combine chart data
  const chartData = useMemo(() => [...avgPeakData, ...livePoints], [avgPeakData, livePoints]);

  // Load persisted data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const savedSessions = await AsyncStorage.getItem('sessions');
        const savedAvgPeaks = await AsyncStorage.getItem('avgPeakData');
        if (!mounted) return;

        const parsedSessions = savedSessions ? JSON.parse(savedSessions) : [];
        const parsedPeaks = savedAvgPeaks ? JSON.parse(savedAvgPeaks) : [];

        setSessions(parsedSessions);
        setAvgPeakData(parsedPeaks);
        setHasLoadedSessions(true);
        hasLoadedRef.current = true;
      } catch (e) {
        console.warn("Failed to load persisted data", e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Save sessions safely after load
  useEffect(() => { if (hasLoadedRef.current) persistSessions(sessions); }, [sessions]);
  useEffect(() => { if (hasLoadedRef.current) persistAvgPeaks(avgPeakData); }, [avgPeakData]);

  // Stable BLE handler
  const handleBLEPacket = useCallback((error: any, char: any) => {
    if (error || !char?.value) return;

    const decoded = base64.decode(char.value).trim();
    if (!decoded.startsWith("{")) return;

    let data: any = null;
    try { data = JSON.parse(decoded); } catch { return; }

    // ---- START ----
    if (data.event === "START") {
      const newSession: TremorSession = {
        id: generateUniqueId(),
        date: new Date().toISOString().split("T")[0],
        mode: "Automatic",
        duration: 0,
        before: data.before || 0,
        after: 0,
        reduction: 0,
        avgFrequency: 0,
      };
      currentSessionRef.current = newSession;
      tremorFreqsRef.current = [];
      setLivePoints([]);
      return;
    }

    // ---- LIVE FREQ ----
    if (data.freq !== undefined && currentSessionRef.current) {
      tremorFreqsRef.current.push(Number(data.freq));

      // update live points safely
      setLivePoints(prev => [...prev.slice(-19), { value: Number(data.freq), label: "", date: new Date().toLocaleTimeString() }]);
      return;
    }

    // ---- STOP ----
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

      // save to Firestore
      if (user) {
        saveSessionToFirestore({
          userId: user.uid,
          mode: finishedSession.mode,
          duration: finishedSession.duration,
          before: finishedSession.before,
          after: finishedSession.after,
          avgFrequency: finishedSession.avgFrequency,
          reduction: finishedSession.reduction,
        }).catch(err => console.warn("[FIRESTORE] Failed:", err));
      }

      // update sessions using ref to avoid closure issues
      const updatedSessions = [...sessionsRef.current, finishedSession];
      setSessions(updatedSessions);
      persistSessions(updatedSessions);

      // update avgPeakData using ref
      const day = currentSessionRef.current.date;
      const dayLabel = getDayAbbreviation(day);
      const sessionsForDay = updatedSessions.filter(s => s.date === day);
      const dayAverage = sessionsForDay.reduce((a, s) => a + s.avgFrequency, 0) / sessionsForDay.length;
      const newPoint: PeakDataPoint = { value: parseFloat(dayAverage.toFixed(2)), label: dayLabel, date: day };
      const nextAvg = [...avgPeakDataRef.current.filter(p => p.date !== day), newPoint];
      setAvgPeakData(nextAvg);
      persistAvgPeaks(nextAvg);

      // reset
      currentSessionRef.current = null;
      tremorFreqsRef.current = [];
      setLivePoints([]);
    }

  }, [user]);

  // BLE subscription
  useEffect(() => {
    const cleanup = () => {
      try { subscriptionRef.current?.remove?.(); subscriptionRef.current = null; } catch {}
    };

    cleanup();
    if (!device) return cleanup;

    let mounted = true;
    const setup = async () => {
      try {
        await device.discoverAllServicesAndCharacteristics();
        if (!mounted) return;
        subscriptionRef.current = device.monitorCharacteristicForService(
          CONTROL_SERVICE_UUID,
          STATE_CHAR_UUID,
          handleBLEPacket
        );
      } catch (e) { console.warn("[BLE] setup failed", e); }
    };
    setup();
    return () => { mounted = false; cleanup(); };
  }, [device, handleBLEPacket]);

  // Weekly & monthly summary
  useEffect(() => {
    if (!hasLoadedSessions) return;

    if (!sessions.length) {
      setWeeklySummary({ avgSuppressionFreq: 0, effectiveSessions: "0/0" });
      setMonthlySummary({ activeSuppressionTime: 0, tremorShiftFrom: 0, tremorShiftTo: 0 });
      return;
    }

    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now); monthStart.setMonth(now.getMonth() - 1);

    const weekly = sessions.filter((s) => new Date(s.date) >= weekStart);
    const monthly = sessions.filter((s) => new Date(s.date) >= monthStart);

    const avgFreq = weekly.length ? weekly.reduce((sum, s) => sum + s.avgFrequency, 0) / weekly.length : 0;
    const effective = weekly.filter((s) => s.reduction > 30).length;

    setWeeklySummary({
      avgSuppressionFreq: parseFloat(avgFreq.toFixed(1)),
      effectiveSessions: `${effective}/${weekly.length}`,
    });

    const totalTime = monthly.reduce((sum, s) => sum + s.duration, 0) / 3600;
    const shiftFrom = monthly.length ? Math.max(...monthly.map((s) => s.before)) : 0;
    const shiftTo = monthly.length ? Math.min(...monthly.map((s) => s.after)) : 0;

    setMonthlySummary({
      activeSuppressionTime: parseFloat(totalTime.toFixed(1)),
      tremorShiftFrom: shiftFrom,
      tremorShiftTo: shiftTo,
    });
  }, [sessions, hasLoadedSessions]);

  // PDF Export
  const handleDownloadReport = async () => {
    if (!sessions.length) return;
    const latestSession = sessions[sessions.length - 1];
    const pdfData = {
      tremorData: avgPeakData,
      frequencyData: tremorFreqsRef.current.map((v) => ({ value: v })),
      sessions: [{
        ...latestSession,
        duration: latestSession.duration.toString(),
        after: latestSession.after,
        avgFrequency: latestSession.avgFrequency,
      }],
    };
    await generatePDFReport(pdfData);
  };


  // Render
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Live Peak Suppression Tremor (Avg.)</Text>
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
