import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { firebaseAuth, signInEmail, signUpEmail, logOut, db, doc, getDoc, setDoc } from '../firebase';
import { generateKeyPair, getPrivateKey } from '../lib/crypto';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to ensure keys exist in IDB and Firestore
  const ensureKeysExist = async (user) => {
    if (!user) return;
    try {
      let privateKey = await getPrivateKey(user.uid);
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!privateKey) {
        console.log("No local private key found. Generating new RSA pair...");
        const publicKeyJwk = await generateKeyPair(user.uid);
        
        // Save to Firestore
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          aliases: userSnap.exists() && userSnap.data().aliases ? userSnap.data().aliases : [user.email],
          publicKey: publicKeyJwk
        }, { merge: true });
        console.log("Keys generated and saved to Firestore.");
      } else {
        // Ensure user doc exists in Firestore even if we have local keys
        if (!userSnap.exists()) {
           console.log("No Firestore doc found. Generating new keys to sync...");
           const publicKeyJwk = await generateKeyPair(user.uid);
           await setDoc(userRef, {
             uid: user.uid,
             email: user.email,
             aliases: [user.email],
             publicKey: publicKeyJwk
           }, { merge: true });
        }
      }

      // Sync aliases state
      if (userSnap.exists()) {
        setAliases(userSnap.data().aliases || [user.email]);
      } else {
        setAliases([user.email]);
      }
    } catch (e) {
      console.error("Error ensuring crypto keys:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async user => {
      if (user) {
        await ensureKeysExist(user);
      }
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addAlias = async (newAlias) => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const updatedAliases = [...aliases, newAlias];
    await setDoc(userRef, { aliases: updatedAliases }, { merge: true });
    setAliases(updatedAliases);
  };

  const removeAlias = async (aliasToRemove) => {
    if (!currentUser || aliasToRemove === currentUser.email) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const updatedAliases = aliases.filter(a => a !== aliasToRemove);
    await setDoc(userRef, { aliases: updatedAliases }, { merge: true });
    setAliases(updatedAliases);
  };

  const loginWithEmail = useCallback(async (email, password) => {
    try {
      const result = await signInEmail(email, password);
      await ensureKeysExist(result.user);
      return result;
    } catch (error) {
      console.error("Failed to login with email", error);
      throw error;
    }
  }, []);

  const signupWithEmail = useCallback(async (email, password) => {
    try {
      const result = await signUpEmail(email, password);
      await ensureKeysExist(result.user);
      return result;
    } catch (error) {
      console.error("Failed to signup with email", error);
      throw error;
    }
  }, []);

  const logoutUser = useCallback(async () => {
    try {
      await logOut();
      setAliases([]);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }, []);

  const value = useMemo(() => ({
    currentUser,
    aliases,
    addAlias,
    removeAlias,
    loginWithEmail,
    signupWithEmail,
    logout: logoutUser,
  }), [currentUser, aliases, addAlias, removeAlias, loginWithEmail, signupWithEmail, logoutUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#16171d]">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
