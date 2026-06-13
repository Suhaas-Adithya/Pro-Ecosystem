import React, { useState } from 'react';
import './FriendsList.css';

export default function FriendsList() {
  const [tab, setTab] = useState('Online');
  const [friends, setFriends] = useState([]);

  const filteredFriends = friends.filter(f => {
    if (tab === 'Online') return f.status !== 'Offline';
    if (tab === 'All') return true;
    return false;
  });

  return (
    <div className="friends-list-container">
      <div className="friends-header">
        <div className="friends-title">
          <span className="friends-icon">👋</span> Friends
        </div>
        <div className="friends-tabs">
          <div className={`f-tab ${tab === 'Online' ? 'active' : ''}`} onClick={() => setTab('Online')}>Online</div>
          <div className={`f-tab ${tab === 'All' ? 'active' : ''}`} onClick={() => setTab('All')}>All</div>
          <div className={`f-tab ${tab === 'Pending' ? 'active' : ''}`} onClick={() => setTab('Pending')}>Pending</div>
          <div className={`f-tab ${tab === 'Blocked' ? 'active' : ''}`} onClick={() => setTab('Blocked')}>Blocked</div>
          <div className="f-tab add-friend">Add Friend</div>
        </div>
      </div>

      <div className="friends-body">
        <div className="friends-search">
          <input type="text" placeholder="Search friends" />
        </div>
        <div className="friends-count">{tab.toUpperCase()} — {filteredFriends.length}</div>
        
        <div className="friends-grid">
          {filteredFriends.map(friend => (
            <div key={friend.id} className="friend-row">
              <div className="friend-info">
                <div className="friend-avatar" style={{ overflow: 'hidden' }}>
                  {friend.avatar?.startsWith('data:image') ? (
                    <img src={friend.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    friend.avatar
                  )}
                  <div className={`status-dot ${friend.status.toLowerCase().replace(/ /g, '-')}`}></div>
                </div>
                <div className="friend-details">
                  <div className="friend-name">{friend.username}</div>
                  <div className="friend-status">{friend.customStatus || friend.status}</div>
                </div>
              </div>
              <div className="friend-actions">
                <button className="btn-circle">💬</button>
                <button className="btn-circle">📞</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
