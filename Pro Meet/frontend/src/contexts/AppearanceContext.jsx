import React, { createContext, useContext, useState, useEffect } from 'react';

const AppearanceContext = createContext();

export function useAppearance() {
  return useContext(AppearanceContext);
}

export function AppearanceProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('pro_theme') || 'dark');
  const [density, setDensity] = useState(() => localStorage.getItem('pro_density') || 'spacious');

  useEffect(() => {
    // Apply theme class
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
    localStorage.setItem('pro_theme', theme);
  }, [theme]);

  useEffect(() => {
    // Apply density class
    if (density === 'congested') {
      document.body.classList.add('layout-congested');
    } else {
      document.body.classList.remove('layout-congested');
    }
    localStorage.setItem('pro_density', density);
  }, [density]);

  const value = {
    theme,
    setTheme,
    density,
    setDensity
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}
