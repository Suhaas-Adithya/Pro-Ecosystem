import React, { useState } from 'react';
import { initAudioContext, playMouseSound } from '../utils/SynthAudio';

export default function HomeDashboard({ onNavigate, currentTheme }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    initAudioContext();
    playMouseSound(currentTheme?.mouseNoise || 'modern-tick');

    // Basic URL vs Search check
    let target = searchQuery.trim();
    if (target.match(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/) && !target.startsWith('http')) {
      target = `https://${target}`;
    } else if (!target.startsWith('http') && !target.startsWith('pro://')) {
      target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
    }

    onNavigate(target);
  };

  const quickLinks = [
    { icon: '📝', label: 'Keep', url: 'http://localhost:5186' },
    { icon: '💻', label: 'Dev', url: 'http://localhost:5176' },
    { icon: '💬', label: 'Chat', url: 'http://localhost:5178' },
    { icon: '⚙️', label: 'Settings', url: 'pro://settings' }
  ];

  return (
    <div className="zen-new-tab animate-slide-up">
      <div className="zen-new-tab-content">
        
        {/* Centered Search/Address Bar */}
        <form className={`zen-search-container ${isFocused ? 'focused' : ''}`} onSubmit={handleSearchSubmit}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="zen-search-input"
            placeholder="Search the web or enter a URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoFocus
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </form>

        {/* Minimal Quick Links */}
        <div className="zen-quick-links">
          {quickLinks.map((link, idx) => (
            <button
              key={idx}
              className="quick-link-btn"
              onClick={() => onNavigate(link.url)}
              title={link.label}
            >
              <div className="quick-link-icon">{link.icon}</div>
              <span>{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .zen-new-tab {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .zen-new-tab-content {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
          padding: 2rem;
        }

        .zen-search-container {
          width: 100%;
          display: flex;
          align-items: center;
          background: rgba(15, 12, 30, 0.4);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border: 1px solid var(--glass-border);
          border-radius: 100px;
          padding: 0.5rem 1.25rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .zen-search-container.focused {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15), 0 10px 40px rgba(0,0,0,0.3);
          transform: translateY(-2px);
          background: rgba(15, 12, 30, 0.6);
        }

        .search-icon {
          font-size: 1.2rem;
          color: var(--text-muted);
          margin-right: 0.75rem;
        }
        
        .zen-search-container.focused .search-icon {
          color: var(--accent-color);
        }

        .zen-search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 1.1rem;
          font-family: inherit;
          padding: 0.75rem 0;
        }

        .zen-search-input::placeholder {
          color: var(--text-muted);
        }

        .clear-search-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          transition: all 0.2s;
        }

        .clear-search-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .zen-quick-links {
          display: flex;
          gap: 1.5rem;
        }

        .quick-link-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.8;
        }

        .quick-link-btn:hover {
          opacity: 1;
          transform: translateY(-2px);
        }

        .quick-link-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .quick-link-btn:hover .quick-link-icon {
          background: rgba(139, 92, 246, 0.1);
          border-color: var(--accent-color);
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .quick-link-btn span {
          font-size: 0.8rem;
          color: var(--text-primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
