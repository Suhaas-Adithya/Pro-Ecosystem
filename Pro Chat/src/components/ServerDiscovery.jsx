import React, { useState } from 'react';

export default function ServerDiscovery({ servers, profile, onJoinServer }) {
  const [searchTerm, setSearchTerm] = useState('');

  const publicServers = servers.filter(s => !profile.joinedServers?.includes(s.id));

  const filtered = publicServers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="discovery-container glass-panel" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
      <div className="discovery-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#f2f3f5', marginBottom: '16px' }}>Discover Public Communities</h1>
        <p style={{ color: '#b5bac1', fontSize: '16px' }}>Find your new favorite place to hang out.</p>
        <div style={{ marginTop: '24px', maxWidth: '600px', margin: '24px auto 0' }}>
          <input 
            type="text" 
            placeholder="Explore communities" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', background: '#1e1f22', color: 'white', fontSize: '16px' }}
          />
        </div>
      </div>

      <h3 style={{ color: '#f2f3f5', marginBottom: '20px' }}>Featured Communities</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filtered.length === 0 ? (
          <p style={{ color: '#80848e' }}>No communities found.</p>
        ) : (
          filtered.map(server => (
            <div key={server.id} style={{ background: '#2b2d31', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                 onClick={() => onJoinServer(server.id)}>
              <div style={{ height: '100px', background: '#5865F2' }}></div>
              <div style={{ padding: '20px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-24px', left: '20px', width: '48px', height: '48px', background: '#313338', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', border: '4px solid #2b2d31' }}>
                  {server.icon}
                </div>
                <h4 style={{ color: '#f2f3f5', marginTop: '16px', marginBottom: '8px' }}>{server.name}</h4>
                <p style={{ color: '#b5bac1', fontSize: '14px', marginBottom: '16px' }}>A public community for enthusiasts to chat, chill, and collaborate.</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#80848e' }}>• Public Server</span>
                  <button style={{ background: '#43b581', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}>Join</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
