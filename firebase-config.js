// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBCXaYJI9dxwqKD1Qsb_9AOdsnVTPG2uHM",
    authDomain: "pjotters-company.firebaseapp.com",
    databaseURL: "https://pjotters-company-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pjotters-company",
    storageBucket: "pjotters-company.firebasestorage.app",
    messagingSenderId: "64413422793",
    appId: "1:64413422793:web:37debb74f7c7d3ead6e918",
    measurementId: "G-BHQ2S1TWTH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Helper functies voor database operaties
export const dbRef = {
  user: (uid) => ref(db, `users/${uid}`),
  games: (uid) => ref(db, `users/${uid}/games`),
  points: (uid) => ref(db, `users/${uid}/points`),
  rewards: (uid) => ref(db, `users/${uid}/rewards`),
  proContent: () => ref(db, 'pro_content'),
  premiumContent: () => ref(db, 'premium_content')
};

// Gebruikersdata structuur
export const createNewUserData = (uid, email) => ({
  uid,
  email,
  points: 0,
  subscription: {
    type: 'basic'
  },
  games: {
    flappyBird: { highscore: 0 },
    snake: { highscore: 0 },
    pacman: { highscore: 0 }
  },
  rewards: [],
  accessibleCompanies: {},
  createdAt: serverTimestamp()
});