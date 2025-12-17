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
import { useAuth } from "@/context/authContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, verifyBeforeUpdateEmail } from "firebase/auth";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

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

  //For fetching full name from firebase
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const {user, signout} = useAuth();
  //for logout
  const router = useRouter();


  // For editing email
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");

  // For editing password
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");


  // REAUTHENTICATION HELPER

  async function reauthenticate(password:string) {
    try{
      const credential = EmailAuthProvider.credential(user.email, password);
      return await reauthenticateWithCredential(user, credential);
    }catch(error){
      console.log("Reauthentication error: ",error);
      throw error;
    }
    
  }

  //  CHANGE EMAIL FUNCTION
  async function handleChangeEmail() {
    try{
      if(!newEmail || !currentPasswordForEmail){
        alert("Please fill in all fields");
        return;
      }

      await reauthenticate(currentPasswordForEmail);

      await verifyBeforeUpdateEmail(user, newEmail);

      alert("Verification email sent!\n\nPlease check your new email inbox and click the verification link to complete the update");

      setEmailModalVisible(false);
      setNewEmail("");
      setCurrentPasswordForEmail("");

    }catch (error:any) {
      console.log("Email update error: ", error);
      alert(error?.message || "Could not update email. Try again.")
    }
    
  }


  //  CHANGE PASSWORD FUNCTION
  async function handleChangePassword() {
    try{
      if(!newPassword || !currentPasswordForPassword){
        alert("Please fill in all fields");
        return;
      }

      await reauthenticate(currentPasswordForPassword);

      await updatePassword(user, newPassword);

      
      alert("Password updated successfully!");

      setPasswordModalVisible(false);
      setNewPassword("");
      setCurrentPasswordForPassword("");

    }catch (error:any) {
      console.log("Password update error: ", error);
      alert(error?.message || "Could not update password. Try again.")
    }
    
  }

  //  LOCAL NOTIFICATIONS SETUP
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

  //  LOAD USER DATA FROM FIREBASE
  useEffect(()=> {
    async function loadUserData() {
      if(!user) return;

      setEmail(user.email);
      
      const ref = doc(db,"users", user.uid);
      const snap = await getDoc(ref);

      if(snap.exists()){
        setFullName(snap.data().name || "");
      }
      
    }

    loadUserData();
  },[user]);

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
  
  //  LOGOUT CONFIRMATION MESSAGE
  const confirmLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const result = await signout();

            if (!result.success) {
              alert(result.msg || "Logout failed");
              return;
            }

            router.replace("/(auth)/signin");
          },
        },
      ]
    );
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
          <TextInput editable={false} value={fullName} style={styles.input} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput editable={false} value={email} style={styles.input} />
        </View>

        {/* SECURITY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={22} color="#5A5CE4" />
            </View>
            <Text style={styles.cardTitle}>Security</Text>
          </View>

          <TouchableOpacity style={styles.buttonRow} onPress={() => setEmailModalVisible(true)}>
            <MaterialIcons name="email" size={20} color="#444" />
            <Text style={styles.buttonRowText}>Change Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonRow} onPress={() => setPasswordModalVisible(true)}>
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
        <TouchableOpacity style={styles.signOutBtn} onPress={confirmLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* CHANGE EMAIL MODAL */}
      {emailModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Email</Text>

            <Text style={styles.label}>New Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new email"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
            />

            <Text style={styles.label}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              secureTextEntry
              value={currentPasswordForEmail}
              onChangeText={setCurrentPasswordForEmail}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#E55656" }]}
                onPress={() => setEmailModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#5A5CE4" }]}
                onPress={handleChangeEmail}
              >
                <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* CHANGE PASSWORD MODAL */}
      {passwordModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
             />

            <Text style={styles.label}>Current Password</Text>
             <TextInput
              style={styles.input}
              placeholder="Enter current password"
              secureTextEntry
              value={currentPasswordForPassword}
              onChangeText={setCurrentPasswordForPassword}
             />

            <View style={styles.modalButtons}>
              <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#E55656" }]}
              onPress={() => setPasswordModalVisible(false)}
                >
                <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#5A5CE4" }]}
                onPress={handleChangePassword}
                >
              <Text style={styles.modalButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFF",
  },

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

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  reminderTextBlock: {
    flexShrink: 1,
    maxWidth: "75%",
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

  // change email
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 999,
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    elevation: 5,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 16,
    textAlign: "center",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },

  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },

  modalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
