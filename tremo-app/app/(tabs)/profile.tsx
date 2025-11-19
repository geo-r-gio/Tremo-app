import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';

export default function ProfileScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => {
    const now = new Date();
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });

  /* --------------------------
      LOCAL NOTIFICATIONS SETUP
  ---------------------------*/
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Notification permissions not granted');
        }
      } catch (err) {
        console.warn('Notifications permission error:', err);
      }
    };

    requestPermissions();
  }, []);

  const scheduleDailyReminder = async (time: Date) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const trigger: Notifications.CalendarTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Tremor Session Reminder",
          body: "It's time to start your tremor monitoring session!",
          sound: true,
        },
        trigger,
      });
    } catch (err) {
      console.warn('Failed to schedule notification:', err);
    }
  };

  const onToggleReminders = async (value: boolean) => {
    setRemindersEnabled(value);

    if (!value) {
      setShowTimePicker(false);
      await Notifications.cancelAllScheduledNotificationsAsync();
    } else {
      await scheduleDailyReminder(reminderTime);
    }
  };

  const onChangeTime = async (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setReminderTime(selectedTime);
      await scheduleDailyReminder(selectedTime);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 130 }}>
      <View>
        <Text style={styles.screenTitle}>Profile</Text>
        <Text style={styles.screenSubtitle}>Manage your account settings</Text>

        {/* ACCOUNT INFORMATION */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="person-outline" size={22} color="#5A5CE4" />
            </View>
            <Text style={styles.cardTitle}>Account Information</Text>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput editable={false} value="John Doe" style={styles.input} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput editable={false} value="john.doe@email.com" style={styles.input} />
        </View>

        {/* SECURITY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={22} color="#5A5CE4" />
            </View>
            <Text style={styles.cardTitle}>Security</Text>
          </View>

          <TouchableOpacity style={styles.buttonRow}>
            <MaterialIcons name="email" size={20} color="#444" />
            <Text style={styles.buttonRowText}>Change Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonRow}>
            <Ionicons name="lock-closed-outline" size={20} color="#444" />
            <Text style={styles.buttonRowText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* REMINDERS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={22} color="#5A5CE4" />
            </View>
            <Text style={styles.cardTitle}>Tremor Session Reminders</Text>
          </View>

          <View style={styles.rowBetween}>
            <View style={styles.reminderTextBlock}>
              <Text style={styles.label}>Enable Daily Reminders</Text>
              <Text style={styles.description}>
                Get notified to start your tremor monitoring session
              </Text>
            </View>

            <Switch
              value={remindersEnabled}
              onValueChange={onToggleReminders}
              thumbColor="#fff"
              trackColor={{ false: "#ccc", true: "#5A5CE4" }}
            />
          </View>

          {remindersEnabled && (
            <>
              <Text style={[styles.label, { marginTop: 18 }]}>Reminder Time</Text>

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeText}>{formatTime(reminderTime)}</Text>
                <Ionicons name="time-outline" size={20} color="#444" />
              </TouchableOpacity>
            </>
          )}

          {showTimePicker && (
            <View style={{ height: 200 }}>
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="spinner"
                themeVariant="light"
                onChange={onChangeTime}
              />
            </View>
          )}
        </View>

        {/* SIGN OUT BUTTON */}
        <TouchableOpacity style={styles.signOutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },

  /* Page title */
  screenTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 40,
    color: "#111",
  },
  screenSubtitle: {
    color: "#777",
    marginBottom: 20,
  },

  /* Cards */
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
  },

  /* Inputs */
  label: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
    marginTop: 4,
  },

  input: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    color: "#333",
  },

  description: {
    color: "#777",
    fontSize: 13,
  },

  /* Security button rows */
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  buttonRowText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },

  /* Reminder section */
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  reminderTextBlock: {
    flexShrink: 1,
    maxWidth: "75%", // prevents text from pushing the switch
    paddingRight: 10,
  },

  timeInput: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  timeText: {
    fontSize: 15,
    color: "#333",
  },

  /* Sign Out */
  signOutBtn: {
    backgroundColor: "#E55656",
    padding: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
});
