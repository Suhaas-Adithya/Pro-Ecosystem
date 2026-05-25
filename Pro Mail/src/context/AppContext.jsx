import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const openCompose = (data = null) => {
    setComposeData(data);
    setIsComposeOpen(true);
  };

  const closeCompose = () => {
    setIsComposeOpen(false);
    setComposeData(null);
  };

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode(prev => !prev);
  }, []);

  return (
    <AppContext.Provider value={{ 
      searchTerm, setSearchTerm, 
      isComposeOpen, openCompose, closeCompose, composeData,
      isFocusMode, setIsFocusMode, toggleFocusMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
