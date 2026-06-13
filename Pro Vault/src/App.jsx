import React, { useState, useEffect } from 'react';
import './App.css'; // Assuming basic CSS is present

function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [vaultItems, setVaultItems] = useState([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', username: '', password: '', type: 'Login', icon: '🌐' });
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/profile?uid=global_device');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }

        const vRes = await fetch('http://localhost:3001/api/vault');
        if (vRes.ok) {
          const vData = await vRes.json();
          setVaultItems(vData.files || []); // Using 'files' as that is what backend sends for vault currently
        }
      } catch (err) {
        console.warn('Init failed:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const handleSaveItem = async () => {
    const itemToSave = { ...newItem, id: Date.now() };
    try {
      await fetch('http://localhost:3001/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemToSave)
      });
      setVaultItems(prev => [...prev, itemToSave]);
      setShowNewModal(false);
      setNewItem({ title: '', username: '', password: '', type: 'Login', icon: '🌐' });
    } catch (err) {
      alert('Failed to save vault item.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  const togglePassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Unlocking Pro Vault...</div>;
  if (!profile) return <div style={{ color: 'white', padding: 20 }}>Please sign into Pro Suite ecosystem via Pro Browser.</div>;

  return (
    <div className="vault-app">
      <div className="sidebar">
        <div className="sidebar-header">🛡️ Pro Vault</div>
        <div className="nav-links">
          <div className="nav-item active">🔑 Logins</div>
          <div className="nav-item">📝 Secure Notes</div>
          <div className="nav-item">💳 Credit Cards</div>
          <div className="nav-item">🆔 Identities</div>
        </div>
        <div className="lock-status">
          <span className="lock-icon">🔒</span>
          Vault is Locked & Synced
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search your vault..." />
          </div>
          <button className="new-item-btn" onClick={() => setShowNewModal(true)}>+ New Item</button>
        </div>

        {vaultItems.length === 0 ? (
          <div style={{ padding: 40, color: 'var(--text-muted)', textAlign: 'center' }}>
            No items in vault. Click "+ New Item" to securely store a password.
          </div>
        ) : (
          <div className="items-grid">
            {vaultItems.map(item => (
              <div className="item-card" key={item.id}>
                <div className="item-header">
                  <div className="item-logo">{item.icon}</div>
                  <div>
                    <div className="item-title">{item.title}</div>
                    <div className="item-username">{item.username}</div>
                  </div>
                </div>
                
                <div className="item-field">
                  <input 
                    type={showPasswords[item.id] ? "text" : "password"} 
                    value={item.password} 
                    readOnly 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                  />
                  <button className="copy-btn" onClick={() => togglePassword(item.id)} title="Show/Hide">
                    {showPasswords[item.id] ? '🙈' : '👁️'}
                  </button>
                  <button className="copy-btn" onClick={() => copyToClipboard(item.password)} title="Copy Password">
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showNewModal && (
          <div className="modal-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, color: 'white' }}>New Vault Item</h3>
              
              <input type="text" placeholder="Title (e.g. Netflix)" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Username / Email" value={newItem.username} onChange={e => setNewItem({...newItem, username: e.target.value})} style={inputStyle} />
              <input type="password" placeholder="Password" value={newItem.password} onChange={e => setNewItem({...newItem, password: e.target.value})} style={inputStyle} />
              
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => setShowNewModal(false)} style={{ flex: 1, padding: 8, background: 'transparent', color: 'white', border: '1px solid gray', borderRadius: 6 }}>Cancel</button>
                <button onClick={handleSaveItem} style={{ flex: 1, padding: 8, background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 6 }}>Save Securely</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'white',
  outline: 'none'
};

export default App;
