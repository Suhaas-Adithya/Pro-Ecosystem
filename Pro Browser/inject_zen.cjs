const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf-8');
content = content.replace(/\r\n/g, '\n'); // Normalize line endings

// 1. Add state hooks
content = content.replace(
  "  const [showDevTools, setShowDevTools] = useState(false);\n  const [devToolsTab, setDevToolsTab] = useState('dom');",
  `  const [showDevTools, setShowDevTools] = useState(false);
  const [devToolsTab, setDevToolsTab] = useState('dom');

  // Wave 3: Focus & Productivity States
  const [focusTimer, setFocusTimer] = useState({ active: false, timeLeft: 25 * 60 });
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notesData, setNotesData] = useState(() => localStorage.getItem('pro_quick_notes') || '');`
);

// 2. Add focus timer logic before getFavicon
content = content.replace(
  "  const getFavicon = (url) => {",
  `  // ─── FOCUS TIMER LOGIC ───
  useEffect(() => {
    let interval = null;
    if (focusTimer.active && focusTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setFocusTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (focusTimer.timeLeft === 0) {
      setFocusTimer(prev => ({ ...prev, active: false, timeLeft: 25 * 60 }));
      alert("Focus Session Complete! Take a break.");
    }
    return () => clearInterval(interval);
  }, [focusTimer]);

  const toggleFocusTimer = () => {
    setFocusTimer(prev => ({ 
      ...prev, 
      active: !prev.active,
      timeLeft: prev.timeLeft === 0 ? 25 * 60 : prev.timeLeft 
    }));
  };

  const getFavicon = (url) => {`
);


// 3. Replace the top container start using indexOf
const newStartStr = `  return (
    <div className={isAgentWindow ? "autopilot-workspace-split" : "zen-browser-layout"}>
      
      {/* ─── GLOBAL BACKGROUND WALLPAPER ─── */}
      {!isAgentWindow && currentTheme.newTabWallpaper && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
          {currentTheme.newTabWallpaper.endsWith('.mp4') ? (
            <video src={currentTheme.newTabWallpaper} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ background: \`url(\${currentTheme.newTabWallpaper})\`, backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%' }} />
          )}
        </div>
      )}

      {/* ─── WINDOWS 11 WINDOW CONTROLS ─── */}
      {!isAgentWindow && (
        <div className="zen-window-controls-windows">
          <span className="min" title="Minimize">─</span>
          <span className="max" title="Maximize">□</span>
          <span className="close" title="Close">✕</span>
        </div>
      )}

      <div className="zen-main-split" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* ─── ZEN SIDEBAR (HIDDEN IN AGENT MODE) ─── */}
        {!isAgentWindow && (
          <div className="zen-sidebar">
            <div className="workspace-pill" title="Click to cycle Workspaces">
              <div className="workspace-pill-icon">💻</div>
              <div className="workspace-pill-text">Personal Space</div>
            </div>

            <div className="zen-tabs-container">
              {tabs.map((t) => {
                const isActive = t.id === activeTabId;
                let icon = '🌐';
                if (t.url.includes('pro://home')) icon = '🏠';
                else if (t.url.includes('pro://themes')) icon = '🎨';
                else if (t.url.includes('pro://store')) icon = '🧩';
                else if (t.url.includes('pro://agent')) icon = '🤖';
                else if (t.url.includes('pro://docs')) icon = '📝';
                else if (t.url.includes('pro://sheets')) icon = '📊';
                else if (t.url.includes('pro://slides')) icon = '🖼️';
                
                return (
                  <div 
                    key={t.id} 
                    className={\`zen-tab \${isActive ? 'active' : ''}\`}
                    onClick={() => setActiveTabId(t.id)}
                    title={t.title}
                  >
                    <div className="zen-tab-icon">{icon}</div>
                    <div className="zen-tab-title">{t.title}</div>
                    {tabs.length > 1 && (
                      <button className="zen-tab-close" onClick={(e) => { e.stopPropagation(); handleCloseTab(t.id, e); }}>✕</button>
                    )}
                  </div>
                );
              })}
              <button className="zen-add-tab" onClick={handleAddNewTab} title="New Tab">
                <div className="zen-tab-icon">+</div>
                <div className="zen-tab-title">New Tab</div>
              </button>
            </div>
            
            <div className="zen-sidebar-bottom">
              <div className="zen-tab" onClick={() => navigateToUrl('pro://settings')} title="Settings">
                <div className="zen-tab-icon">⚙️</div>
                <div className="zen-tab-title">Settings</div>
              </div>
              <div className="zen-tab" onClick={() => navigateToUrl('pro://home')} title="Profile">
                <div className="zen-tab-icon" style={{ borderRadius: '50%', overflow: 'hidden', padding: 0, height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {userProfile.avatar && userProfile.avatar.startsWith('data:') ? (
                    <img src={userProfile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{userProfile.avatar}</span>
                  )}
                </div>
                <div className="zen-tab-title">{userProfile.name}</div>
              </div>
            </div>
          </div>
        )}

        <div className={isAgentWindow ? "autopilot-workspace-left" : "zen-content-area"} style={{ flex: 1 }}>
          <div 
            className="pro-browser-app"`;

const startIdx1 = content.indexOf('  return (\n    <div className={isAgentWindow ? "autopilot-workspace-split" : "pro-browser-normal-container"}>');
const startIdx2 = content.indexOf('          {/* ─── BROWSER SHELL HEADER ─── */}');

if (startIdx1 === -1 || startIdx2 === -1) {
    console.error("Failed to find top container string");
    process.exit(1);
}
content = content.substring(0, startIdx1) + newStartStr + "\n" + content.substring(startIdx2);


// 4. Replace the old browser-shell-header block with the floating header up to browser-content-viewport
const headerStartIdx = content.indexOf('          {/* ─── BROWSER SHELL HEADER ─── */}');
const headerEndIdx = content.indexOf('          {/* ─── BROWSER SCREEN DISPLAY AREA ─── */}');

if (headerStartIdx === -1 || headerEndIdx === -1) {
    console.error("Failed to find header boundaries");
    process.exit(1);
}

const newHeader = `          {/* ─── FLOATING WEBVIEW HEADER ─── */}
            {!isAgentWindow && !activeTab.url.startsWith('pro://welcome') && (
              <div className="zen-content-header" style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--bg-primary)', alignItems: 'center' }}>
                <div className="nav-controls" style={{ display: 'flex', gap: '0.2rem' }}>
                  <button type="button" className="zen-nav-btn" onClick={handleGoBack} disabled={activeTab.historyIndex === 0}>◀</button>
                  <button type="button" className="zen-nav-btn" onClick={handleGoForward} disabled={activeTab.historyIndex === activeTab.history.length - 1}>▶</button>
                  <button type="button" className="zen-nav-btn" onClick={() => navigateToUrl(userProfile.isSignedIn ? 'pro://home' : 'pro://welcome')}>🏠</button>
                </div>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    navigateToUrl(addressInput);
                  }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center' }}
                >
                  <div className={\`zen-address-container \${isSecure ? 'secure' : ''}\`} style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '0.4rem 1rem', border: '1px solid var(--glass-border)' }}>
                    <span className="security-icon" style={{ fontSize: '0.8rem', marginRight: '0.5rem', color: isSecure ? 'var(--success-color)' : 'var(--text-secondary)' }}>{isSecure ? '🔒 pro://' : '🌐 http://'}</span>
                    <input 
                      type="text"
                      className="zen-address-input"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Search with Google or enter address"
                      style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                    />
                    {isLoading && <div className="address-spinner animate-spin" style={{ marginLeft: '8px' }}>✦</div>}
                  </div>
                </form>

                <button 
                  type="button" 
                  className="zen-nav-btn focus-timer-btn" 
                  onClick={toggleFocusTimer}
                  title={focusTimer.active ? "Stop Focus Timer" : "Start 25m Focus Session"}
                  style={{ color: focusTimer.active ? 'var(--accent-color)' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                >
                  ⏱️ {focusTimer.active ? \`\${Math.floor(focusTimer.timeLeft / 60)}:\${String(focusTimer.timeLeft % 60).padStart(2, '0')}\` : ''}
                </button>
                <button type="button" className="zen-nav-btn" onClick={() => setIsNotesOpen(!isNotesOpen)} title="Toggle Quick Notes" style={{ color: isNotesOpen ? 'var(--accent-color)' : 'inherit' }}>
                  📝
                </button>
                <button type="button" className="zen-nav-btn" onClick={() => {
                  setTabs(tabs.map(t => t.id === activeTabId ? { ...t, isPinned: !t.isPinned } : t));
                }} title={activeTab.isPinned ? "Unpin Tab" : "Pin Tab"} style={{ color: activeTab.isPinned ? 'var(--accent-color)' : 'inherit' }}>
                  📌
                </button>
                <button type="button" className="zen-nav-btn" onClick={() => {
                  if (splitViewUrl) setSplitViewUrl(null);
                  else setSplitViewUrl('pro://home');
                }} title={splitViewUrl ? "Close Split View" : "Open Split View"} style={{ color: splitViewUrl ? 'var(--accent-color)' : 'inherit' }}>
                  {splitViewUrl ? '◧' : '◨'}
                </button>
                <button type="button" className="zen-nav-btn" onClick={() => setShowDevTools(!showDevTools)} title="Toggle Developer Tools">
                  {showDevTools ? '🛠️' : '👨‍💻'}
                </button>
              </div>
            )}

`;

content = content.substring(0, headerStartIdx) + newHeader + content.substring(headerEndIdx);

// 5. Wrap the content inside browser-content-viewport
const viewportStartIdx = content.indexOf('          {/* ─── BROWSER SCREEN DISPLAY AREA ─── */}');
const viewportEndIdx = content.indexOf('            {activeTab.url === \'pro://home\' && (', viewportStartIdx);

if (viewportStartIdx === -1 || viewportEndIdx === -1) {
    console.error("Failed to find viewport boundaries");
    process.exit(1);
}

const newViewportStart = `          {/* ─── BROWSER VIEWPORT ─── */}
          <div className="browser-content-viewport" style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="split-view-container" style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              <div className="primary-view" style={{ flex: 1, position: 'relative', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
`;

content = content.substring(0, viewportStartIdx) + newViewportStart + content.substring(viewportEndIdx);


// 6. Close the containers and add Split View and Quick Notes
const endStartIdx = content.indexOf('          )}\n        </div>\n      </div>\n\n      {/* ─── GEMMA AUTOPILOT SIDE PANEL');

if (endStartIdx === -1) {
    console.error("Failed to find bottom container string!");
    process.exit(1);
}

const newEndStr = `          )}
              </div>

              {/* ─── SPLIT VIEW PANEL ─── */}
              {splitViewUrl && (
                <div className="split-view" style={{ width: '350px', position: 'relative', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--glass-border)' }}>
                  <div className="split-view-header" style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      value={splitViewUrl} 
                      onChange={(e) => setSplitViewUrl(e.target.value)} 
                      style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px' }} 
                    />
                    <button className="zen-nav-btn" onClick={() => setSplitViewUrl(null)}>✕</button>
                  </div>
                  {splitViewUrl.startsWith('pro://') ? (
                    <div style={{ padding: '1rem', color: 'white' }}>Internal page open in split view.</div>
                  ) : (
                    <iframe 
                      src={splitViewUrl.startsWith('http') ? splitViewUrl : \`https://\${splitViewUrl}\`} 
                      style={{ flex: 1, border: 'none', background: 'white' }} 
                    />
                  )}
                </div>
              )}

              {/* ─── WAVE 3: QUICK NOTES PANEL ─── */}
              {isNotesOpen && (
                <div className="quick-notes-panel glass-card" style={{ width: '300px', borderLeft: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', zIndex: 10 }}>
                  <div className="notes-header" style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Quick Notes</h3>
                    <button className="zen-nav-btn" onClick={() => setIsNotesOpen(false)}>✕</button>
                  </div>
                  <div className="notes-body" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    <textarea
                      value={notesData}
                      onChange={(e) => {
                        setNotesData(e.target.value);
                        localStorage.setItem('pro_quick_notes', e.target.value);
                      }}
                      placeholder="Jot down quick thoughts here... (Auto-saves)"
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '200px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-primary)',
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ─── GEMMA AUTOPILOT SIDE PANEL`;

content = content.substring(0, endStartIdx) + newEndStr + content.substring(endStartIdx + 81);

// Save back to file
fs.writeFileSync('src/App.jsx', content, 'utf-8');
console.log('Successfully injected Zen Layout logic!');
