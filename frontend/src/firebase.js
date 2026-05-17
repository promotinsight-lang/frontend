// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

// এখানে আপনার ফায়ারবেস থেকে পাওয়া আসল কনফিগারেশন বসান
const firebaseConfig = {
  apiKey: "AIzaSyDP9R3Fx0ADFGKLDULEJIKEJc33ZAYSZkU",
  authDomain: "promotinsight.firebaseapp.com",
  projectId: "promotinsight",
  storageBucket: "promotinsight.appspot.com",
  messagingSenderId: "240161143140",
  appId: "1:240161143140:web:98b521b47c2c3d35f1a271"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Providers setup
const googleProvider = new GoogleAuthProvider();
const yahooProvider = new OAuthProvider('yahoo.com');

export { auth, googleProvider, yahooProvider };