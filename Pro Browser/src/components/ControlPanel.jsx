import React, { useState, useEffect } from 'react';

export default function ControlPanel({ onClose, onNavigate }) {
  const [profile, setProfile] = useState({ username: '', avatar: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/api/profile?uid=global_device')
      .then(res => res.json())
      .then(data => {
        if (data.profile) setProfile(data.profile);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('http://localhost:3001/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: 'global_device', profileData: profile })
      });
      // Emit event so other apps know profile changed
      // We can do this from the backend or just alert here
      alert('Global Profile Updated! Changes will sync across the ecosystem.');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>⚙️ Pro Control Panel</h2>
        <button onClick={onClose} style={styles.closeBtn}>×</button>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          <h3 style={{ color: '#aaa', marginBottom: '1rem' }}>Global Identity Matrix</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={styles.label}>
              Ecosystem Username
              <input
                style={styles.input}
                type="text"
                value={profile.username || ''}
                onChange={e => setProfile({ ...profile, username: e.target.value })}
                placeholder="Agent 47"
                required
              />
            </label>
            <label style={styles.label}>
              Pro Eco Email
              <input
                style={styles.input}
                type="email"
                value={profile.email || ''}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                placeholder="agent@pro.eco"
              />
            </label>
            <label style={styles.label}>
              Avatar (Emoji or URL)
              <input
                style={styles.input}
                type="text"
                value={profile.avatar || ''}
                onChange={e => setProfile({ ...profile, avatar: e.target.value })}
                placeholder="👾"
              />
            </label>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? 'SYNCING TO MESH...' : 'SAVE & BROADCAST IDENTITY'}
            </button>
          </form>
        </div>

        <div style={styles.card}>
          <h3 style={{ color: '#aaa', marginBottom: '1rem' }}>System Telemetry</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <span>Pro Drive Storage</span>
            <span>45% Used</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#333', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <div style={{ width: '45%', height: '100%', background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)', borderRadius: '4px' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <span>Event Bus Mesh Network</span>
            <span style={{ color: '#10b981' }}>ONLINE (11 Nodes)</span>
          </div>
        </div>
        
        {/* Onboarding / Setup Card */}
        <div style={styles.card}>
          <h3 style={{ color: '#aaa', marginBottom: '1rem' }}>Browser Initialization</h3>
          <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Want to re-experience the Zen first-run setup wizard? This will allow you to quickly change themes, import bookmarks, and set up your environment again.
          </p>
          <button 
            type="button" 
            style={{ ...styles.saveBtn, width: '100%', background: 'linear-gradient(90deg, #10b981, #059669)' }}
            onClick={() => {
              if (onNavigate) {
                onNavigate('pro://welcome');
              } else {
                window.location.reload();
              }
            }}
          >
            REPLAY ONBOARDING 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%', height: '100%',
    backgroundColor: '#0a0a0f',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'linear-gradient(90deg, rgba(15,23,42,0.8), rgba(88,28,135,0.2))'
  },
  closeBtn: {
    background: 'transparent', border: 'none', color: '#fff', fontSize: '2rem',
    cursor: 'pointer', lineHeight: '1'
  },
  content: {
    padding: '2rem', display: 'flex', gap: '2rem',
    overflowY: 'auto'
  },
  card: {
    flex: 1,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '2rem',
    backdropFilter: 'blur(10px)'
  },
  label: {
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
    fontSize: '0.85rem', color: '#ccc'
  },
  input: {
    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px', padding: '0.75rem', color: '#fff', fontSize: '1rem',
    outline: 'none', transition: 'border-color 0.2s'
  },
  saveBtn: {
    background: 'linear-gradient(90deg, #8B5CF6, #3B82F6)',
    color: '#fff', border: 'none', padding: '1rem', borderRadius: '6px',
    fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem'
  }
};
