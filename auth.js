import { auth, db, createNewUserData } from './firebase-config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  serverTimestamp
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

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
    // Maak de gebruiker aan met Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update het gebruikersprofiel met de naam
    await updateProfile(user, {
      displayName: name
    });

    // Maak gebruikersdata aan in de Realtime Database
    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      email: email,
      name: name,
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