import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { 
  ref, 
  set, 
  get,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js';

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error('Login mislukt: ' + error.message);
  }
};

export const registerUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: name
    });

    // Uitgebreide gebruikersdata structuur
    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      email: email,
      name: name,
      points: 0,
      subscription: {
        type: 'basic',
        battlePass: {
          premium: false,
          tier: 1,
          points: 0
        }
      },
      games: {
        flappyBird: { highscore: 0 },
        snake: { highscore: 0 },
        pacman: { highscore: 0 }
      },
      miniGames: {
        memoryCard: { highscore: 0, gamesPlayed: 0 },
        wordScramble: { highscore: 0, gamesPlayed: 0 },
        quickMath: { highscore: 0, gamesPlayed: 0 }
      },
      dailyMissions: {},
      powerUps: {},
      inventory: {},
      createdAt: serverTimestamp()
    });

    return user;
  } catch (error) {
    console.error('Registratie fout:', error);
    throw new Error('Registratie mislukt: ' + error.message);
  }
};

export const checkUserAccess = async (uid) => {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  const userData = snapshot.val();
  
  return {
    isPro: userData?.subscription?.type === 'pro' || userData?.subscription?.type === 'premium',
    isPremium: userData?.subscription?.type === 'premium',
    points: userData?.points || 0
  };
};

export const initAuthListener = (onLogin, onLogout) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const access = await checkUserAccess(user.uid);
      onLogin(user, access);
    } else {
      onLogout();
    }
  });
}; 