# Tremo-App

> Mobile application for controlling and analyzing a wearable tremor suppression device.
> This app enables secure authentication, Bluetooth communication with the wearable hardware,
> real-time tremor data visualization, session tracking, and cloud-based analytics storage.

---

## 📌 Features

- 🔐 **User Authentication** (Firebase Auth)
- 📶 **Bluetooth Low Energy (BLE)** connection to the wearable device
- 🕹 **Real-Time Control** of device vibration output
- 📈 **Live Tremor Visualization**
- 📅 **Session Tracking & Analytics**
- 📄 **Session PDF Export**
- 👤 **Profile & Account Management**
- ☁️ **Secure Cloud Storage (Firestore)**

---

## 📱 Screens / UI Flow

The app includes:

1. **Authentication screens** (Sign In / Sign Up / Password Reset)
2. **Bluetooth enable and device connection**
3. **Control interface for real-time device interaction**
4. **Live tremor frequency charts**
5. **Weekly & Monthly summary analytics**
6. **Profile management**
7. **Downloadable session reports**

---

## 🏗 Technology Stack

**Frontend:**
- React Native + Expo
- TypeScript
- React Navigation
- react-native-gifted-charts

**Backend / Cloud:**
- Firebase Authentication
- Firestore (NoSQL cloud database)

**Device Communication:**
- Bluetooth Low Energy (BLE) with Base64-encoded characteristic values

---

## ⚙️ Requirements

Before setup:

- Node.js (v18+ recommended)
- npm or yarn
- Expo CLI
- A BLE-compatible mobile device
- Firebase account with Auth & Firestore enabled

---

## 🚀 Installation

1. **Clone the repository**

```bash
git clone https://github.com/geo-r-gio/Tremo-app.git
cd Tremo-app
```

2. **Install Dependencies**

```bash
npm install
# or
yarn install
```
3. **Start the Expo Server**

```bash
npx expo start
```
4. Download Expo-go app and open the app

- Scan the QR code with Expo Go
- Or run on emulator/simulator

---

## 🔧 Project Configuration

# Firebase Setup

1. Create a Firebase project:
   https://console.firebase.google.com

2. Enable:
   - Authentication -> Email/Password
   - Firestore Database
  
3. Add your Firebase configuration in your app:
   - Usually via a firebaseConfig.js or environment variables
