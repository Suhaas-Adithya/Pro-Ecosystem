import React, { useState } from 'react';
import './Modals.css';

export default function CreateChannelModal({ serverId, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('text');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type: type
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Channel</h2>
          <p>in {serverId}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>CHANNEL TYPE</label>
              <div className="radio-group">
                <label className={`radio-label ${type === 'text' ? 'selected' : ''}`}>
                  <input type="radio" name="type" value="text" checked={type === 'text'} onChange={() => setType('text')} />
                  # Text Channel
                </label>
                <label className={`radio-label ${type === 'voice' ? 'selected' : ''}`}>
                  <input type="radio" name="type" value="voice" checked={type === 'voice'} onChange={() => setType('voice')} />
                  🔊 Voice Channel
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>CHANNEL NAME</label>
              <div className="channel-input-wrapper">
                <span className="hash-prefix">{type === 'text' ? '#' : '🔊'}</span>
                <input 
                  type="text" 
                  placeholder="new-channel"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Channel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
