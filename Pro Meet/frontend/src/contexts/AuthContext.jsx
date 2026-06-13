import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback profile if server is offline
  const MOCK_PROFILE = {
    uid: 'global_device',
    email: 'admin@pro.com',
    displayName: 'Administrator',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  };

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/profile?uid=global_device');
        if (res.ok) {
          const data = await res.json();
          if (active && data.profile) {
            setCurrentUser({
              uid: 'global_device',
              email: data.profile.email || MOCK_PROFILE.email,
              displayName: data.profile.username || MOCK_PROFILE.displayName,
              photoURL: data.profile.avatar || MOCK_PROFILE.photoURL
            });
          }
        } else {
          if (active) setCurrentUser(MOCK_PROFILE);
        }
      } catch (err) {
        console.warn("SSO fetch failed, using fallback.", err);
        if (active) setCurrentUser(MOCK_PROFILE);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, []);

  const login = async () => {
    setCurrentUser(MOCK_PROFILE);
  };
  const logout = async () => {
    setCurrentUser(null);
  };

  // Mock functions for Settings Panel 
  const check2FAStatus = async () => false;
  const enroll2FA = async () => {};
  const remove2FA = async () => {};
  const changePassword = async () => {};

  const value = {
    currentUser,
    login,
    logout,
    check2FAStatus,
    enroll2FA,
    remove2FA,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
