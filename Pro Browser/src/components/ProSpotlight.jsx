import React, { useState, useEffect, useRef } from 'react';
import './ProSpotlight.css';

const SOCKET_URL = 'http://localhost:3001';

export default function ProSpotlight({ isOpen, onClose, onNavigate, tabs = [], onSwitchTab, browserActions = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Global search data (apps, bookmarks, local files)
  const [searchIndex, setSearchIndex] = useState([
    { title: 'Pro Home', url: 'pro://home', type: 'app', icon: '🏠' },
    { title: 'Pro Theme Store', url: 'pro://themes', type: 'app', icon: '🎨' },
    { title: 'Pro Extension Store', url: 'pro://store', type: 'app', icon: '🧩' },
    { title: 'Pro AI Autopilot', url: 'http://localhost:5183', type: 'app', icon: '🤖' },
    { title: 'Pro Docs', url: 'pro://docs', type: 'app', icon: '📝' },
    { title: 'Pro Sheets', url: 'pro://sheets', type: 'app', icon: '📊' },
    { title: 'Pro Slides', url: 'pro://slides', type: 'app', icon: '🖼️' },
    { title: 'Pro Chat (Discord)', url: 'http://localhost:5178', type: 'app', icon: '💬' },
    { title: 'Pro Drive', url: 'http://localhost:5179', type: 'app', icon: '☁️' },
    { title: 'Pro Calendar', url: 'http://localhost:5180', type: 'app', icon: '📅' },
    { title: 'Pro Vault', url: 'http://localhost:5181', type: 'app', icon: '🛡️' },
    { title: 'Pro Hub', url: 'http://localhost:5182', type: 'app', icon: '🔔' },
    { title: 'Pro Dev (ADE)', url: 'http://localhost:5176', type: 'app', icon: '💻' },
    { title: 'Pro Arcade', url: 'http://localhost:5184', type: 'app', icon: '🎮' },
    { title: 'Pro Audio', url: 'http://localhost:5185', type: 'app', icon: '🎵' }
  ]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);

      // Fetch file system dynamically to build the index
      fetch(`${SOCKET_URL}/api/fs/list`)
        .then(res => res.json())
        .then(data => {
          if (data && data.files) {
            const fileResults = [];
            
            // Helper to recursively flatten the file tree
            const traverse = (nodes, pathStr) => {
              for (const node of nodes) {
                if (node.isDir && node.children) {
                  traverse(node.children, `${pathStr}${node.name}/`);
                } else if (!node.isDir) {
                  // Only index documents or useful files
                  if (node.name.endsWith('.md') || node.name.endsWith('.txt') || node.name.endsWith('.json')) {
                    fileResults.push({
                      title: node.name,
                      url: `pro://docs?file=${encodeURIComponent(node.path)}`,
                      type: 'file',
                      icon: '📄',
                      path: `${pathStr}${node.name}`
                    });
                  }
                }
              }
            };
            
            traverse(data.files, '/');
            
            // Rebuild the full search index
            setSearchIndex([
              ...[
                { title: 'Pro Home', url: 'pro://home', type: 'app', icon: '🏠' },
                { title: 'Pro Theme Store', url: 'pro://themes', type: 'app', icon: '🎨' },
                { title: 'Pro Extension Store', url: 'pro://store', type: 'app', icon: '🧩' },
                { title: 'Pro AI Autopilot', url: 'http://localhost:5183', type: 'app', icon: '🤖' },
                { title: 'Pro Docs', url: 'pro://docs', type: 'app', icon: '📝' },
                { title: 'Pro Sheets', url: 'pro://sheets', type: 'app', icon: '📊' },
                { title: 'Pro Slides', url: 'pro://slides', type: 'app', icon: '🖼️' },
              ],
              ...browserActions,
              ...tabs.map(tab => ({
                title: tab.title || tab.url,
                url: tab.url,
                type: 'tab',
                icon: tab.isPinned ? '📌' : '🌍',
                tabId: tab.id
              })),
              ...fileResults
            ]);
          }
        }).catch(err => console.error("Spotlight FS fetch error:", err));
    }
  }, [isOpen, tabs, browserActions]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(searchIndex.slice(0, 5)); // show recent/default
    } else {
      const q = query.toLowerCase();
      const filtered = searchIndex.filter(item => 
        item.title.toLowerCase().includes(q) || (item.path && item.path.toLowerCase().includes(q))
      );
      setResults(filtered.slice(0, 8)); // max 8 results
    }
    setSelectedIndex(0);
  }, [query, searchIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
          const res = results[selectedIndex];
          if (res.type === 'tab' && res.tabId) {
            onSwitchTab(res.tabId);
          } else if (res.type === 'action' && res.action) {
            res.action();
          } else {
            onNavigate(res.url);
          }
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose, onNavigate]);

  if (!isOpen) return null;

  return (
    <div className="spotlight-overlay" onMouseDown={onClose}>
      <div className="spotlight-modal glass-card" onMouseDown={e => e.stopPropagation()}>
        <div className="spotlight-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="spotlight-input"
            placeholder="Search Pro Suite (Apps, Docs, Files)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="esc-hint">ESC</span>
        </div>
        
        {results.length > 0 ? (
          <div className="spotlight-results">
            {results.map((res, idx) => (
              <div 
                key={idx} 
                className={`spotlight-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  if (res.type === 'tab' && res.tabId) {
                    onSwitchTab(res.tabId);
                  } else if (res.type === 'action' && res.action) {
                    res.action();
                  } else {
                    onNavigate(res.url);
                  }
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div className="item-icon">{res.icon}</div>
                <div className="item-details">
                  <div className="item-title">{res.title}</div>
                  {res.path && <div className="item-path">{res.path}</div>}
                </div>
                <div className="item-type">{res.type}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="spotlight-no-results">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
