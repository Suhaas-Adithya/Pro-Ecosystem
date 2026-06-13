import React, { useState } from 'react';
import './Modals.css';

export default function CreateServerModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🌟');

  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    onSubmit({ id, name, icon });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    onSubmit({ type: 'join', id: inviteCode });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create Your Server</h2>
          <p>Your server is where you and your friends hang out. Make yours and start talking.</p>
        </div>
        
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="form-group">
              <label>SERVER ICON (EMOJI)</label>
              <input 
                type="text" 
                value={icon} 
                onChange={e => setIcon(e.target.value)} 
                maxLength={2}
                className="input-emoji"
              />
            </div>
            <div className="form-group">
              <label>SERVER NAME</label>
              <input 
                type="text" 
                placeholder="My Awesome Server"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Back</button>
            <button type="submit" className="btn-primary">Create</button>
          </div>
        </form>

        <div style={{ background: '#2b2d31', padding: '16px 24px', borderRadius: '0 0 8px 8px', borderTop: '1px solid #1e1f22' }}>
          <h3 style={{ color: '#f2f3f5', fontSize: '14px', marginBottom: '8px' }}>Have an invite already?</h3>
          <form onSubmit={handleJoin} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Enter Invite Code" 
              value={inviteCode} 
              onChange={e => setInviteCode(e.target.value)}
              style={{ flex: 1, padding: '10px', background: '#1e1f22', border: 'none', color: '#dbdee1', borderRadius: '4px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 16px', background: '#4f545c' }}>Join Server</button>
          </form>
        </div>
      </div>
    </div>
  );
}
