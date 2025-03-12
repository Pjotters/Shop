import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getDatabase, ref, get, set, update, onValue } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-analytics.js';

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
export const auth = getAuth(app);
export const db = getDatabase(app);
export const analytics = getAnalytics(app);

// Re-export database functies
export { ref, get, set, update, onValue };

// Helper functies voor database operaties
export const dbRef = {
    user: (uid) => ref(db, `users/${uid}`),
    games: (uid) => ref(db, `users/${uid}/games`),
    points: (uid) => ref(db, `users/${uid}/points`),
    rewards: (uid) => ref(db, `users/${uid}/rewards`),
    proContent: () => ref(db, 'pro_content'),
    premiumContent: () => ref(db, 'premium_content'),
    battlePass: (uid) => ref(db, `users/${uid}/battlePass`),
    miniGames: (uid) => ref(db, `users/${uid}/miniGames`),
    missions: (uid) => ref(db, `users/${uid}/dailyMissions`),
    powerUps: (uid) => ref(db, `users/${uid}/powerUps`),
    inventory: (uid) => ref(db, `users/${uid}/inventory`)
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
  coupons: {},
  createdAt: serverTimestamp()
});