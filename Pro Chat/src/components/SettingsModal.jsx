import React, { useState } from 'react';
import './Modals.css';

export default function SettingsModal({ profile, onClose }) {
  const [activeTab, setActiveTab] = useState('account');
  const [username, setUsername] = useState(profile.username || '');
  const [avatar, setAvatar] = useState(profile.avatar || '🎮');
  const [customStatus, setCustomStatus] = useState(profile.customStatus || '');
  const fileInputRef = useRef(null);

  const handleSave = async () => {
    try {
      await fetch('http://localhost:3001/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'global_device',
          profileData: { ...profile, username, avatar, customStatus }
        })
      });
      alert('Profile updated! Refresh to see changes globally.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 128;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = MAX_SIZE;
        canvas.height = MAX_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#313338';
        ctx.fillRect(0, 0, MAX_SIZE, MAX_SIZE);
        const offsetX = (MAX_SIZE - width) / 2;
        const offsetY = (MAX_SIZE - height) / 2;
        ctx.drawImage(img, offsetX, offsetY, width, height);
        setAvatar(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const renderAvatarPreview = (ava) => {
    if (!ava) return '📸';
    if (ava.startsWith('data:image')) {
      return <img src={ava} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return ava;
  };

  return (
    <div className="settings-overlay">
      <div className="settings-sidebar">
        <div className="settings-header">USER SETTINGS</div>
        <div className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>My Account</div>
        <div className={`settings-tab ${activeTab === 'voice' ? 'active' : ''}`} onClick={() => setActiveTab('voice')}>Voice & Video</div>
        <div className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>Appearance</div>
        <div className="settings-divider"></div>
        <div className="settings-tab" style={{color: '#ed4245'}} onClick={() => alert('Log Out from Ecosystem via Pro Browser.')}>Log Out</div>
      </div>
      <div className="settings-content">
        <button className="settings-close" onClick={onClose}>✕<div className="esc-hint">ESC</div></button>
        
        {activeTab === 'account' && (
          <div className="settings-section">
            <h2>My Account</h2>
            <div className="profile-card">
              <div className="profile-card-header"></div>
              <div className="profile-card-body">
                <div className="profile-card-avatar" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer', overflow: 'hidden' }}>
                  {renderAvatarPreview(avatar)}
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
                </div>
                <div className="profile-card-info">
                  <h3>{username}</h3>
                  <p>{profile.email}</p>
                </div>
                <button className="btn-primary" onClick={handleSave}>Save Changes</button>
              </div>
              <div className="profile-card-edit">
                <div className="form-group">
                  <label>USERNAME</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>CUSTOM STATUS</label>
                  <input type="text" value={customStatus} onChange={e => setCustomStatus(e.target.value)} placeholder="e.g. 🎧 Listening to Spotify" />
                </div>
                <div className="form-group">
                  <label>AVATAR (EMOJI BACKUP)</label>
                  <input type="text" value={avatar.startsWith('data:image') ? '' : avatar} onChange={e => setAvatar(e.target.value)} maxLength={2} placeholder="Or upload an image above" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="settings-section">
            <h2>Voice & Video</h2>
            <div className="form-group">
              <label>INPUT DEVICE</label>
              <select><option>Default - Windows Audio</option></select>
            </div>
            <div className="form-group">
              <label>OUTPUT DEVICE</label>
              <select><option>Default - Speakers</option></select>
            </div>
            <div className="mic-test">
              <label>MIC TEST</label>
              <button className="btn-outline">Let's Check</button>
              <div className="mic-bar"><div className="mic-level"></div></div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="settings-section">
            <h2>Appearance</h2>
            <div className="form-group">
              <label>THEME</label>
              <div className="theme-options">
                <div className="theme-option active">Dark</div>
                <div className="theme-option">Light</div>
                <div className="theme-option">Sync with Pro OS</div>
              </div>
            </div>
            <div className="form-group">
              <label>MESSAGE DISPLAY</label>
              <div className="radio-group">
                <label className="radio-label selected"><input type="radio" checked readOnly/> Cozy</label>
                <label className="radio-label"><input type="radio" readOnly/> Compact</label>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
