import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { firebaseAuth, signInWithGoogle, signInEmail, signUpEmail, linkAccountWithPassword, logOut, isMocked, reauthenticateUser, updateUserPassword, check2FAStatus, verify2FAChallenge, enable2FA as firebaseEnable2FA, disable2FA as firebaseDisable2FA } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we are using Mock auth and they just 'logged in', we track it locally
    // In real firebase, this listener fires automatically
    const unsubscribe = firebaseAuth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    try {
      const result = await signInWithGoogle();
      const needs2FA = await check2FAStatus(result.user.uid);
      
      if (needs2FA) {
        setPendingUser(result.user);
        return { user: result.user, needs2FA: true };
      }

      if (isMocked) {
        setCurrentUser(result.user);
      }
      return { user: result.user, needs2FA: false };
    } catch (error) {
      console.error("Failed to log in", error);
      throw error;
    }
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    try {
      const result = await signInEmail(email, password);
      const needs2FA = await check2FAStatus(result.user.uid);

      if (needs2FA) {
        setPendingUser(result.user);
        return { user: result.user, needs2FA: true };
      }

      if (isMocked) setCurrentUser(result.user);
      return { user: result.user, needs2FA: false };
    } catch (error) {
      console.error("Failed to login with email", error);
      throw error;
    }
  }, []);

  const confirm2FA = useCallback(async (code) => {
    const userToVerify = pendingUser || currentUser;
    if (!userToVerify) throw new Error("No user to verify");

    const isValid = await verify2FAChallenge(userToVerify.uid, code);
    if (isValid) {
      if (pendingUser) {
        setCurrentUser(pendingUser);
        setPendingUser(null);
      }
      return true;
    }
    throw new Error("Invalid 2FA code");
  }, [pendingUser, currentUser]);

  const enroll2FA = useCallback(async (secret, code) => {
    if (!currentUser) throw new Error("No user logged in");
    // Verify first then enable
    const isValid = await verify2FAChallenge(currentUser.uid, code);
    if (isValid) {
      await firebaseEnable2FA(currentUser.uid, secret);
      return true;
    }
    throw new Error("Invalid verification code");
  }, [currentUser]);

  const remove2FA = useCallback(async () => {
    if (!currentUser) return;
    await firebaseDisable2FA(currentUser.uid);
  }, [currentUser]);

  const signupWithEmail = useCallback(async (email, password) => {
    try {
      const result = await signUpEmail(email, password);
      if (isMocked) setCurrentUser(result.user);
      return result;
    } catch (error) {
      console.error("Failed to signup with email", error);
      throw error;
    }
  }, []);

  const setPasswordForSocialAccount = useCallback(async (user, email, password) => {
    try {
      await linkAccountWithPassword(user, email, password);
    } catch (error) {
      console.error("Failed to link password", error);
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!currentUser) return;
    try {
      await reauthenticateUser(currentUser, currentPassword);
      await updateUserPassword(currentUser, newPassword);
    } catch (error) {
      console.error("Failed to change password", error);
      throw error;
    }
  }, [currentUser]);

  const logoutUser = useCallback(async () => {
    try {
      await logOut();
      if (isMocked) setCurrentUser(null);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }, []);

  const get2FAStatus = useCallback(async () => {
    if (!currentUser) return false;
    return check2FAStatus(currentUser.uid);
  }, [currentUser]);

  const value = useMemo(() => ({
    currentUser,
    login,
    loginWithEmail,
    signupWithEmail,
    setPasswordForSocialAccount,
    changePassword,
    confirm2FA,
    enroll2FA,
    remove2FA,
    check2FAStatus: get2FAStatus,
    logout: logoutUser,
  }), [
    currentUser, 
    login, 
    loginWithEmail, 
    signupWithEmail, 
    setPasswordForSocialAccount, 
    changePassword, 
    confirm2FA, 
    enroll2FA, 
    remove2FA, 
    get2FAStatus, 
    logoutUser
  ]);

  if (loading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #05050f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid rgba(0, 240, 255, 0.1)',
          borderTopColor: 'var(--neon-blue)',
          borderRadius: '50%',
          animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)'
        }} />
        <div style={{ 
          color: 'var(--neon-blue)', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          letterSpacing: '2px',
          textTransform: 'uppercase',
          animation: 'pulse 2s infinite'
        }}>
          Establishing Secure Link
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
          :root { --neon-blue: #00f0ff; }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
