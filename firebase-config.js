// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase, ref, get, set, update } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDGqK8BXeqaGUoYz4Jh6HHxTxJtGtHU_Tk",
    authDomain: "pjotters-games.firebaseapp.com",
    databaseURL: "https://pjotters-games-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "pjotters-games",
    storageBucket: "pjotters-games.appspot.com",
    messagingSenderId: "1015353201761",
    appId: "1:1015353201761:web:e4973e4df9a48ca36e5c09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

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

export { db, auth, ref, get, set, update };