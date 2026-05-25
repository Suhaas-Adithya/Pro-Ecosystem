import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useShortcuts } from '../context/ShortcutsContext';

export default function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openCompose, closeCompose, isComposeOpen } = useApp();
  const { toggleTheme } = useTheme();
  const { shortcuts } = useShortcuts();

  const dispatch = useCallback((name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(`shortcut:${name}`, { detail }));
  }, []);

  const getActionForKey = useCallback((key, e) => {
    const isCtrl = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    
    for (const [actionId, config] of Object.entries(shortcuts)) {
      const keys = config.keys;
      const keyLower = key.toLowerCase();
      
      // Handle combinations
      const hasCtrl = keys.includes('Ctrl') || keys.includes('Command');
      const hasShift = keys.includes('Shift');
      const hasAlt = keys.includes('Alt');
      
      // Match modifier requirements
      if (hasCtrl !== isCtrl) continue;
      if (hasShift !== isShift) continue;
      if (hasAlt !== isAlt) continue;
      
      // Match the main key (ignoring modifiers in the array)
      const mainKey = keys.find(k => !['Ctrl', 'Command', 'Shift', 'Alt'].includes(k));
      if (mainKey?.toLowerCase() === keyLower) return actionId;
      
      // Special case: single key shortcuts
      if (keys.length === 1 && keys[0].toLowerCase() === keyLower && !isCtrl && !isShift && !isAlt) return actionId;
    }
    return null;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement.tagName.toLowerCase();
      const isTyping =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.activeElement.isContentEditable;

      const key = e.key;

      // ── Escape: hardcoded for safety ──────────────────────────────────────
      if (key === 'Escape') {
        if (isTyping) {
          document.activeElement.blur();
          return;
        }
        if (isComposeOpen) {
          closeCompose();
          return;
        }
        if (location.pathname.startsWith('/email/')) {
          navigate('/');
          return;
        }
        window.dispatchEvent(new CustomEvent('shortcut:escape'));
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const keyLower = key.toLowerCase();

      // ── Focus Mode (Z) ──────────────────────────────────────────────────
      if (!isTyping && !isCtrl && keyLower === 'z') {
        e.preventDefault();
        dispatch('focusMode:toggle');
        return;
      }

      // Check dynamic shortcuts
      const actionId = getActionForKey(key, e);
      
      if (actionId) {
        // If typing, only allow Ctrl/Cmd combos
        const isCtrl = e.ctrlKey || e.metaKey;
        if (isTyping && !isCtrl) return;

        e.preventDefault();
        
        switch (actionId) {
          case 'nav:inbox': navigate('/'); break;
          case 'nav:starred': navigate('/starred'); break;
          case 'nav:sent': navigate('/sent'); break;
          case 'nav:drafts': navigate('/drafts'); break;
          case 'nav:calendar': navigate('/calendar'); break;
          case 'nav:keep': navigate('/keep'); break;
          case 'nav:security': navigate('/security'); break;
          case 'action:compose': openCompose(); break;
          case 'action:search': {
            let searchInput = document.querySelector('[role="dialog"] input[placeholder*="Search"], .fixed input[placeholder*="Search"]');
            if (!searchInput) {
              searchInput = document.querySelector('main input[placeholder*="Search"], main input[placeholder*="search"]');
            }
            if (!searchInput) {
              searchInput = document.querySelector('header input[placeholder*="Search"], input[placeholder*="Search"], input[placeholder*="search"]');
            }
            if (searchInput) {
              searchInput.focus();
              searchInput.select();
            }
            break;
          }
          case 'action:chat': window.dispatchEvent(new CustomEvent('toggleChatSidebar')); break;
          case 'list:next': dispatch('list:next'); break;
          case 'list:prev': dispatch('list:prev'); break;
          case 'list:open': dispatch('list:open'); break;
          case 'email:archive': dispatch('email:archive'); break;
          case 'email:trash': dispatch('email:trash'); break;
          case 'email:star': dispatch('email:toggleStar'); break;
          case 'system:theme': toggleTheme(); break;
          case 'system:help': window.dispatchEvent(new CustomEvent('toggleShortcutsModal')); break;
          default: break;
        }
        return;
      }

      // ── Numeric Keys: hardcoded for now ─────────────────────────────────
      if (!isTyping && !isNaN(key) && key !== ' ') {
        const num = parseInt(key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          dispatch('list:setCategory', { category: ['primary', 'social', 'promotions', 'security'][num - 1] });
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location, openCompose, closeCompose, isComposeOpen, toggleTheme, dispatch, getActionForKey]);
}
