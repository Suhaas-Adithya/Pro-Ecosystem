import { useState, useEffect, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  // We rename this hook internally but keep the export the same so we don't break Pro Keep
  const [value, setValue] = useState(initialValue);
  const initialized = useRef(false);

  useEffect(() => {
    // Fetch from the real ecosystem backend instead of local storage
    const fetchFromEcosystem = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/sync?key=${encodeURIComponent(key)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.value !== null && data.value !== undefined) {
            setValue(data.value);
          }
        }
      } catch (err) {
        console.warn(`Error reading ecosystem sync key "${key}":`, err);
      } finally {
        initialized.current = true;
      }
    };
    fetchFromEcosystem();
  }, [key]);

  useEffect(() => {
    if (!initialized.current) return;
    
    // Save back to the ecosystem backend
    const saveToEcosystem = async () => {
      try {
        await fetch('http://localhost:3001/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
      } catch (err) {
        console.warn(`Error syncing key "${key}" to ecosystem:`, err);
      }
    };
    saveToEcosystem();
  }, [key, value]);

  return [value, setValue];
}
