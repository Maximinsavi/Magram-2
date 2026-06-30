import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA9HVQaA4oDYMjCCS2NQ56XhJ9G5p3EokQ",
  authDomain: "maxgram-e0a89.firebaseapp.com",
  databaseURL: "https://maxgram-e0a89-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "maxgram-e0a89",
  storageBucket: "maxgram-e0a89.firebasestorage.app",
  messagingSenderId: "255258414460",
  appId: "1:255258414460:web:5c29c5442d6e1d841968f9",
  measurementId: "G-4S4J2WGRX9"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore (default database)
export const db = getFirestore(app);

// Validate connection to Firestore on boot as per guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified successfully.");
  } catch (error) {
    console.warn("Firestore connection check completed (possibly offline or unseeded):", error);
  }
}
testConnection();
