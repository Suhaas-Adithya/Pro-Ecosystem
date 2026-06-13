import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [profile, setProfile] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Real-time notifications state (seeded with dummy for aesthetics)
  const [notifications, setNotifications] = useState([
    { id: 1, app: 'Pro Meet', type: 'meet', title: 'Upcoming Meeting in 5 mins', desc: 'Sync with Team (Room: hlmUzOy3)', time: 'Just now', icon: '📹' },
    { id: 2, app: 'Pro Chat', type: 'chat', title: 'New message in #general', desc: 'Dev: Are we ready for Phase 3?', time: '2m ago', icon: '💬' },
    { id: 3, app: 'Pro Keep', type: 'keep', title: 'Reminder: Review PR', desc: 'You set an alarm to review the unified SSO PR.', time: '1hr ago', icon: '⏰' },
  ]);

  useEffect(() => {
    // 1. Fetch SSO Identity
    const fetchSSO = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/profile?uid=global_device');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
        const sysRes = await fetch('http://localhost:3001/api/system');
        if (sysRes.ok) {
          setSystemStats(await sysRes.json());
        }
      } catch (err) {
        console.warn('SSO sync failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSSO();

    // 2. Connect to Ecosystem Event Bus
    const socket = io('http://localhost:3001');
    socket.on('connect', () => {
      console.log('🔗 Connected to Event Bus from Pro Hub');
    });

    socket.on('ecosystem-event', (data) => {
      // Add the new notification to the top of the timeline
      const newNotif = {
        id: Date.now(),
        app: data.sourceApp || 'System',
        type: data.type?.toLowerCase() || 'system',
        title: data.title || 'New Ecosystem Event',
        desc: data.payload || 'No details provided.',
        time: 'Just now',
        icon: data.icon || '🔔'
      };
      setNotifications(prev => [newNotif, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Syncing Notifications...</div>;
  if (!profile) return <div style={{ color: 'white', padding: 20 }}>Please sign into Pro Suite ecosystem via Pro Browser.</div>;

  return (
    <div className="hub-app">
      <div className="header">
        🔔 Pro Hub (Activity Stream)
      </div>

      <div className="timeline">
        {notifications.map(notif => (
          <div className="notification-card" key={notif.id}>
            <div className={`app-icon ${notif.type}`}>
              {notif.icon}
            </div>
            <div className="content">
              <div className="content-header">
                <span className="app-name">{notif.app}</span>
                <span className="time">{notif.time}</span>
              </div>
              <div className="title">{notif.title}</div>
              <div className="description">{notif.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {systemStats && (
        <div className="system-stats" style={{ marginTop: '30px', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--neon-blue)' }}>🖥️ Ecosystem Host Specs</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <div><span style={{color: 'var(--text-secondary)'}}>OS:</span> {systemStats.platform} {systemStats.release}</div>
            <div><span style={{color: 'var(--text-secondary)'}}>Arch:</span> {systemStats.arch}</div>
            <div><span style={{color: 'var(--text-secondary)'}}>CPUs:</span> {systemStats.cpus} Cores</div>
            <div><span style={{color: 'var(--text-secondary)'}}>User:</span> {systemStats.userInfo}</div>
            <div><span style={{color: 'var(--text-secondary)'}}>RAM:</span> {systemStats.totalMem} ({systemStats.freeMem} free)</div>
            <div><span style={{color: 'var(--text-secondary)'}}>Uptime:</span> {systemStats.uptime}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
