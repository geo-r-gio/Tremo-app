// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, collection } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAWO--FCtUE460DTS0ZfqahQcJirhHYHk",
  authDomain: "tremo-5fc38.firebaseapp.com",
  projectId: "tremo-5fc38",
  storageBucket: "tremo-5fc38.firebasestorage.app",
  messagingSenderId: "466088872023",
  appId: "1:466088872023:web:f2ea2c9ac18d3a5f423b12",
  measurementId: "G-RJXFYFLJT1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);

export const userRef = collection(db, 'users');
export const roomRef = collection(db, 'rooms');