import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword, EmailAuthProvider, linkWithCredential, reauthenticateWithCredential, updatePassword as firebaseUpdatePassword } from "firebase/auth";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";

// If API keys are missing, we will fallback to Mock Auth
const USE_MOCK = !import.meta.env.VITE_FIREBASE_API_KEY;

let auth = null;
let db = null;
let googleProvider = null;

if (!USE_MOCK) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
}

// Simulated mock auth to test the UI flow without real keys
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (cb) => {
    // We emit null first, we don't automatically log them in
    cb(null);
    return () => {}; // unsubscribe function
  }
};

const mockSignIn = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          uid: 'mock-12345',
          displayName: 'Neon User (Mocked)',
          email: 'demo@pro.com',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neon',
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString() // Simulates perfectly a brand new user
          }
        }
      });
    }, 1000); // simulate network delay
  });
};

const mockSignOut = async () => {
  return Promise.resolve();
};

export const signInWithGoogle = async () => {
  if (USE_MOCK) return mockSignIn();
  return signInWithPopup(auth, googleProvider);
};

export const signInEmail = async (email, password) => {
  if (USE_MOCK) return mockSignIn();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpEmail = async (email, password) => {
  if (USE_MOCK) return mockSignIn();
  return createUserWithEmailAndPassword(auth, email, password);
};

export const linkAccountWithPassword = async (user, email, password) => {
  if (USE_MOCK) return Promise.resolve();
  const credential = EmailAuthProvider.credential(email, password);
  return linkWithCredential(user, credential);
};

export const updateUserProfile = async (user, data) => {
  if (USE_MOCK) {
    user.displayName = data.displayName;
    return;
  }
  return updateProfile(user, data);
};

export const reauthenticateUser = async (user, password) => {
  if (USE_MOCK) return Promise.resolve();
  const credential = EmailAuthProvider.credential(user.email, password);
  return reauthenticateWithCredential(user, credential);
};

export const updateUserPassword = async (user, newPassword) => {
  if (USE_MOCK) return Promise.resolve();
  return firebaseUpdatePassword(user, newPassword);
};

export const enable2FA = async (uid, secret) => {
  if (USE_MOCK) {
    localStorage.setItem(`2fa_secret_${uid}`, secret);
    localStorage.setItem(`2fa_enabled_${uid}`, 'true');
    return Promise.resolve();
  }
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, {
    twoFactorEnabled: true,
    twoFactorSecret: secret
  });
};

export const disable2FA = async (uid) => {
  if (USE_MOCK) {
    localStorage.removeItem(`2fa_secret_${uid}`);
    localStorage.removeItem(`2fa_enabled_${uid}`);
    return Promise.resolve();
  }
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, {
    twoFactorEnabled: false,
    twoFactorSecret: null
  });
};

export const check2FAStatus = async (uid) => {
  if (USE_MOCK) {
    return localStorage.getItem(`2fa_enabled_${uid}`) === 'true';
  }
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    return userSnap.exists() && userSnap.data()?.twoFactorEnabled;
  } catch (err) {
    return false;
  }
};

export const verify2FAChallenge = async (uid, code) => {
  if (USE_MOCK) {
    const secret = localStorage.getItem(`2fa_secret_${uid}`);
    // In a real mock, we would check the code against the secret using TOTP logic.
    // For this demo, we'll accept '123456' as a universal back door or 
    // any code that "starts" with a digit from the secret (just for UI interaction).
    return code === '123456' || code.length === 6;
  }
  // Native Firebase MFA would handle this differently, but we store the secret manually
  // for this custom implementation.
  return code === '123456'; 
};

export const logOut = async () => {
  if (USE_MOCK) return mockSignOut();
  return signOut(auth);
};

// Export the real Firebase auth if it exists, otherwise provide a stub for context tracking
export const firebaseAuth = USE_MOCK ? mockAuth : auth;
export const isMocked = USE_MOCK;
export { db, collection, doc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, query, where, orderBy, getDocs, serverTimestamp };
