import React, { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT_SHORTCUTS = {
  'nav:inbox': { keys: ['i'], label: 'Go to Inbox' },
  'nav:starred': { keys: ['s'], label: 'Go to Starred' },
  'nav:sent': { keys: ['t'], label: 'Go to Sent' },
  'nav:drafts': { keys: ['d'], label: 'Go to Drafts' },
  'nav:calendar': { keys: ['g'], label: 'Go to Calendar' },
  'nav:keep': { keys: ['h'], label: 'Go to Keep' },
  'nav:security': { keys: ['k'], label: 'Go to Security' },
  'action:compose': { keys: ['c'], label: 'Compose New Email' },
  'action:search': { keys: ['Ctrl', 'Shift', 'S'], label: 'Universal Search' },
  'action:chat': { keys: ['q'], label: 'Toggle Chat Sidebar' },
  'list:next': { keys: ['j'], label: 'Next Item' },
  'list:prev': { keys: ['k'], label: 'Previous Item' },
  'list:open': { keys: ['o'], label: 'Open Item' },
  'email:archive': { keys: ['e'], label: 'Archive Email' },
  'email:trash': { keys: ['delete'], label: 'Trash Email' },
  'email:star': { keys: ['Shift', 's'], label: 'Star Email' },
  'system:theme': { keys: ['Shift', 'd'], label: 'Toggle Dark Mode' },
  'system:help': { keys: ['?'], label: 'Show Help' },
};

const ShortcutsContext = createContext();

export function ShortcutsProvider({ children }) {
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('custom_shortcuts');
    if (saved) {
      const parsed = JSON.parse(saved);
      let modified = false;
      // Auto-migrate action:search if it is still using the old default '/'
      if (parsed['action:search'] && parsed['action:search'].keys.length === 1 && parsed['action:search'].keys[0] === '/') {
        parsed['action:search'] = { keys: ['Ctrl', 'Shift', 'S'], label: 'Universal Search' };
        modified = true;
      }
      // Auto-migrate new Keep nav
      if (!parsed['nav:keep']) {
        parsed['nav:keep'] = { keys: ['h'], label: 'Go to Keep' };
        modified = true;
      }
      if (modified) {
        localStorage.setItem('custom_shortcuts', JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_SHORTCUTS;
  });

  const updateShortcut = (actionId, newKeys) => {
    setShortcuts(prev => {
      const next = { ...prev, [actionId]: { ...prev[actionId], keys: newKeys } };
      localStorage.setItem('custom_shortcuts', JSON.stringify(next));
      return next;
    });
  };

  const resetToDefaults = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.removeItem('custom_shortcuts');
  };

  return (
    <ShortcutsContext.Provider value={{ shortcuts, updateShortcut, resetToDefaults, DEFAULT_SHORTCUTS }}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export const useShortcuts = () => useContext(ShortcutsContext);
