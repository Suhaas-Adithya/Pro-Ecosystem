import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useVoiceChat from './useVoiceChat';
import './App.css';
import SettingsModal from './components/SettingsModal';
import CreateServerModal from './components/CreateServerModal';
import CreateChannelModal from './components/CreateChannelModal';
import Onboarding from './components/Onboarding';
import FriendsList from './components/FriendsList';
import ServerDiscovery from './components/ServerDiscovery';

const SOCKET_URL = 'http://localhost:3001';

const getRole = (username) => {
  if (username === 'Pro_Architect' || username === 'Pro_architect') return 'admin';
  if (username === 'Gemma_Agent') return 'mod';
  return 'member';
};

function App() {
  const [servers, setServers] = useState([]);
  const [channels, setChannels] = useState({});
  const [activeServer, setActiveServer] = useState('home');
  const [activeChannel, setActiveChannel] = useState('');
  const [activeVoice, setActiveVoice] = useState(null);
  const [channelHistories, setChannelHistories] = useState({});
  const [inputMessage, setInputMessage] = useState('');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  
  // Modals & Discord Microfeatures
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { 
    inVoice, startVoice, leaveVoice, audioStreams, 
    localStream, videoEnabled, screenEnabled, toggleVideo, toggleScreen 
  } = useVoiceChat(socketRef, activeVoice, profile);

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/profile?uid=global_device');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
        
        const comRes = await fetch('http://localhost:3001/api/communities');
        if (comRes.ok) {
          const comData = await comRes.json();
          setServers(comData.servers || []);
          setChannels(comData.channels || {});
          if (comData.servers?.length > 0 && !activeChannel) {
            // Keep activeServer as 'home' by default
          }
        }

        const chatRes = await fetch('http://localhost:3001/api/chat');
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          if (chatData.chat) setChannelHistories(chatData.chat);
        }
      } catch (err) {
        console.warn('Init sync failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    if (!profile) return;
    
    socketRef.current = io(SOCKET_URL);
    const roomId = `chat-${activeServer}-${activeChannel}`;
    socketRef.current.emit('join-room', { roomId });

    socketRef.current.on('chat-message', (data) => {
      setChannelHistories(prev => {
        const history = prev[data.channelKey] || [];
        return { ...prev, [data.channelKey]: [...history, data.message] };
      });
      setTypingUsers(prev => {
        const next = {...prev};
        delete next[data.message.sender];
        return next;
      });
    });

    socketRef.current.on('chat-message-edited', (data) => {
      setChannelHistories(prev => {
        const history = prev[data.channelKey] || [];
        return {
          ...prev,
          [data.channelKey]: history.map(m => m.id === data.messageId ? { ...m, text: data.newText, edited: true, isPinned: data.isPinned !== undefined ? data.isPinned : m.isPinned } : m)
        };
      });
    });

    socketRef.current.on('chat-message-deleted', (data) => {
      setChannelHistories(prev => {
        const history = prev[data.channelKey] || [];
        return { ...prev, [data.channelKey]: history.filter(m => m.id !== data.messageId) };
      });
    });

    socketRef.current.on('typing-indicator', (data) => {
      if (data.channelKey === roomId && data.username !== profile.username) {
        setTypingUsers(prev => ({...prev, [data.username]: Date.now()}));
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = {...prev};
            if (Date.now() - next[data.username] > 2500) delete next[data.username];
            return next;
          });
        }, 3000);
      }
    });

    socketRef.current.on('room-users', setMembers); 
    socketRef.current.on('user-connected', userId => setMembers(prev => [...prev, userId]));
    socketRef.current.on('user-disconnected', userId => setMembers(prev => prev.filter(id => id !== userId)));

    return () => socketRef.current.disconnect();
  }, [profile, activeServer, activeChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [channelHistories, activeServer, activeChannel, typingUsers]);

  const saveCommunities = async (newServers, newChannels) => {
    await fetch('http://localhost:3001/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servers: newServers, channels: newChannels })
    });
  };

  const joinServer = async (serverId) => {
    if (!profile) return;
    const currentJoined = profile.joinedServers || [];
    if (currentJoined.includes(serverId)) {
      setActiveServer(serverId);
      return;
    }
    const updatedProfile = { ...profile, joinedServers: [...currentJoined, serverId] };
    setProfile(updatedProfile);
    await fetch('http://localhost:3001/api/profile/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: 'global_device', profileData: updatedProfile })
    });
    setActiveServer(serverId);
    if (channels[serverId]?.text?.length > 0) {
      setActiveChannel(channels[serverId].text[0].id);
    }
  };

  const handleCreateServer = async (serverData) => {
    if (serverData.type === 'join') {
      setShowCreateServer(false);
      await joinServer(serverData.id);
      return;
    }
    
    const newServers = [...servers, serverData];
    const newChannels = { ...channels, [serverData.id]: { text: [{id: 'general', name: 'general'}], voice: [] } };
    setServers(newServers);
    setChannels(newChannels);
    setShowCreateServer(false);
    setActiveServer(serverData.id);
    setActiveChannel('general');
    await saveCommunities(newServers, newChannels);
    await joinServer(serverData.id); // Add creator to joinedServers
  };

  const handleCreateChannel = async (channelData) => {
    const srvChannels = channels[activeServer] || { text: [], voice: [] };
    const updated = { ...srvChannels };
    if (channelData.type === 'text') updated.text.push({ id: channelData.id, name: channelData.name });
    else updated.voice.push({ id: channelData.id, name: channelData.name });
    
    const newChannels = { ...channels, [activeServer]: updated };
    setChannels(newChannels);
    setShowCreateChannel(false);
    if (channelData.type === 'text') setActiveChannel(channelData.id);
    await saveCommunities(servers, newChannels);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !profile) return;

    const newMsg = {
      id: Date.now(),
      sender: profile.username || 'Agent',
      avatar: profile.avatar || '🎮',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      replyTo: replyingTo ? { author: replyingTo.sender, text: replyingTo.text } : null,
      reactions: [],
      isPinned: false
    };

    const channelKey = `chat-${activeServer}-${activeChannel}`;
    setChannelHistories(prev => ({ ...prev, [channelKey]: [...(prev[channelKey] || []), newMsg] }));
    socketRef.current?.emit('broadcast-chat-message', { roomId: channelKey, message: newMsg, channelKey });
    
    fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelKey, message: newMsg })
    });

    setInputMessage('');
    setReplyingTo(null);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing-indicator', { channelKey, username: profile.username, isTyping: false });
  };

  const handleEditMessage = (e) => {
    e.preventDefault();
    if (!editMessageText.trim()) return;
    const channelKey = `chat-${activeServer}-${activeChannel}`;
    fetch('http://localhost:3001/api/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelKey, messageId: editingMessageId, newText: editMessageText })
    });
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleDeleteMessage = (messageId) => {
    const channelKey = `chat-${activeServer}-${activeChannel}`;
    fetch('http://localhost:3001/api/chat', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelKey, messageId })
    });
  };

  const handleTogglePin = (msg) => {
    const channelKey = `chat-${activeServer}-${activeChannel}`;
    const newPinnedStatus = !msg.isPinned;
    fetch('http://localhost:3001/api/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelKey, messageId: msg.id, newText: msg.text, isPinned: newPinnedStatus })
    });
    // Optimistic
    setChannelHistories(prev => {
      const history = prev[channelKey] || [];
      return {
        ...prev,
        [channelKey]: history.map(m => m.id === msg.id ? { ...m, isPinned: newPinnedStatus } : m)
      };
    });
  };

  const handleAddReaction = (messageId, emoji) => {
    const channelKey = `chat-${activeServer}-${activeChannel}`;
    setChannelHistories(prev => {
      const history = prev[channelKey] || [];
      return {
        ...prev,
        [channelKey]: history.map(m => {
          if (m.id === messageId) {
            const rx = m.reactions || [];
            const existing = rx.find(r => r.emoji === emoji);
            if (existing) existing.count++;
            else rx.push({ emoji, count: 1 });
            return { ...m, reactions: rx };
          }
          return m;
        })
      };
    });
  };

  const renderMessageContent = (text) => {
    let formatted = text.split(/(@[\w-]+)/g).map((part, i) => 
      part.startsWith('@') ? <span key={i} className="mention-highlight">{part}</span> : part
    );
    return formatted;
  };

  if (loading) return <div className="loading-screen">Initializing Pro Chat Engine...</div>;
  if (!profile) return <div className="loading-screen">Please sign into the Pro Suite ecosystem via Pro Browser first.</div>;
  if (!profile.proChatOnboarded) return <Onboarding profile={profile} onComplete={(updatedProfile) => setProfile(updatedProfile)} />;

  const currentHistory = channelHistories[`chat-${activeServer}-${activeChannel}`] || [];
  const pinnedMessages = currentHistory.filter(m => m.isPinned);
  const myRole = getRole(profile.username);

  const renderAvatar = (ava) => {
    if (!ava) return '👾';
    if (ava.startsWith('data:image')) {
      return <img src={ava} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />;
    }
    return ava;
  };

  return (
    <div className="pro-chat-app">
      {/* ─── TOP NAV BAR (SERVERS) ─── */}
      <div className="top-nav-bar glass-panel">
        <div className="nav-brand">💬 PRO CHAT</div>
        <div className="server-list">
          <div 
            className={`server-pill ${activeServer === 'home' ? 'active' : ''} home-pill`}
            onClick={() => setActiveServer('home')}
          >
            <span className="server-icon">🏠</span>
            <span className="server-name">Home / DMs</span>
          </div>
          {servers.filter(s => profile.joinedServers?.includes(s.id)).map(s => (
            <div 
              key={s.id} 
              className={`server-pill ${activeServer === s.id ? 'active' : ''} ${s.id === 'home' ? 'home-pill' : ''}`}
              onClick={() => {
                setActiveServer(s.id);
                if (channels[s.id]?.text?.length > 0) setActiveChannel(channels[s.id].text[0].id);
              }}
            >
              <span className="server-icon">{s.icon}</span>
              <span className="server-name">{s.name}</span>
            </div>
          ))}
          <div className="server-pill add-server" onClick={() => setShowCreateServer(true)}>
            <span className="server-icon">+</span>
          </div>
          <div 
            className={`server-pill ${activeServer === 'discovery' ? 'active' : ''}`}
            onClick={() => setActiveServer('discovery')}
          >
            <span className="server-icon" style={{ background: '#43b581' }}>🧭</span>
          </div>
        </div>
      </div>

      <div className="main-workspace">
        {/* ─── LEFT DRAWER: CHANNELS & DMs ─── */}
        {activeServer !== 'discovery' && (
          <div className="side-drawer channels-drawer glass-panel">
            <div className="drawer-header">
              {servers.find(s => s.id === activeServer)?.name}
            </div>
          
          <div className="channel-category">
            {activeServer === 'home' ? 'DIRECT MESSAGES' : 'TEXT CHANNELS'}
            {activeServer !== 'home' && <button className="btn-add-channel" onClick={() => setShowCreateChannel(true)}>+</button>}
          </div>
          {channels[activeServer]?.text?.map(ch => (
            <div 
              key={ch.id} 
              className={`channel-item ${activeChannel === ch.id ? 'active' : ''}`}
              onClick={() => setActiveChannel(ch.id)}
            >
              <span className="hash">{activeServer === 'home' ? '@' : '#'}</span> {ch.name}
            </div>
          ))}

          {channels[activeServer]?.voice && channels[activeServer].voice.length > 0 && (
            <>
              <div className="channel-category" style={{ marginTop: '20px' }}>
                VOICE CHANNELS
                <button className="btn-add-channel" onClick={() => setShowCreateChannel(true)}>+</button>
              </div>
              {channels[activeServer].voice.map(vc => (
                <div 
                  key={vc.id} 
                  className={`channel-item voice-item ${activeVoice === vc.id ? 'active-voice' : ''}`}
                  onClick={() => { if(inVoice) leaveVoice(); setActiveVoice(vc.id); startVoice(`voice-${activeServer}-${vc.id}`); }}
                >
                  <span className="hash">🔊</span> {vc.name}
                </div>
              ))}
            </>
          )}

          <div className="user-profile-panel glass-inset">
            <div className="user-avatar" style={{ overflow: 'hidden' }}>
              {renderAvatar(profile.avatar)}
              <div className="status-dot"></div>
            </div>
            <div className="user-details">
              <div className="username">{profile.username}</div>
              <div className="status">{profile.customStatus || 'Online'}</div>
            </div>
            <button className="btn-settings" onClick={() => setShowSettings(true)}>⚙️</button>
          </div>
        </div>
        )}

        {/* ─── CENTER: CHAT OR FRIENDS LIST OR DISCOVERY ─── */}
        {activeServer === 'home' ? (
          <FriendsList />
        ) : activeServer === 'discovery' ? (
          <ServerDiscovery servers={servers} profile={profile} onJoinServer={joinServer} />
        ) : (
          <div className="chat-area glass-panel">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="hash">#</span> {activeChannel}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-pin-toggle" onClick={() => { navigator.clipboard.writeText(activeServer); alert(`Invite code ${activeServer} copied!`); }}>
                  ✉️ Invite
                </button>
                <button className="btn-pin-toggle" onClick={() => setShowPinned(!showPinned)}>
                  📌 {pinnedMessages.length > 0 && <span className="pin-count">{pinnedMessages.length}</span>}
                </button>
              </div>
            </div>

            <div className="messages-scroll">
              {currentHistory.length === 0 && (
                <div className="welcome-message">
                  Welcome to the beginning of the #{activeChannel} chat.
                </div>
              )}
              {currentHistory.map((msg, idx) => {
                const msgRole = getRole(msg.sender);
                return (
                  <div className={`chat-bubble-container ${msg.isPinned ? 'pinned-highlight' : ''}`} key={msg.id || idx}>
                    <div className="chat-avatar" style={{ overflow: 'hidden' }}>{renderAvatar(msg.avatar)}</div>
                    <div className="chat-bubble">
                      <div className="bubble-header">
                        <span className={`bubble-author role-${msgRole}`}>{msg.sender}</span>
                        <span className="bubble-time">{msg.timestamp} {msg.edited && <span className="edited-tag">(edited)</span>}</span>
                      </div>
                      
                      {msg.replyTo && (
                        <div className="reply-banner">
                          <span className="reply-arrow">↪</span> Replying to <strong>{msg.replyTo.author}</strong>: {msg.replyTo.text.substring(0, 50)}...
                        </div>
                      )}

                      <div className="bubble-content">
                        {editingMessageId === msg.id ? (
                          <form className="edit-form" onSubmit={handleEditMessage}>
                            <input type="text" value={editMessageText} onChange={e => setEditMessageText(e.target.value)} autoFocus />
                            <span className="edit-hint">escape to cancel • enter to save</span>
                          </form>
                        ) : (
                          renderMessageContent(msg.text)
                        )}
                      </div>
                      
                      {msg.reactions?.length > 0 && (
                        <div className="reactions-list">
                          {msg.reactions.map(r => (
                            <div key={r.emoji} className="reaction-pill">{r.emoji} {r.count}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="message-toolbar">
                      <button onClick={() => handleAddReaction(msg.id, '👍')}>😀</button>
                      <button onClick={() => setReplyingTo(msg)}>↩️</button>
                      <button onClick={() => handleTogglePin(msg)}>📌</button>
                      {msg.sender === profile.username && (
                        <>
                          <button onClick={() => { setEditingMessageId(msg.id); setEditMessageText(msg.text); }}>✏️</button>
                          <button className="danger" onClick={() => handleDeleteMessage(msg.id)}>🗑️</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(typingUsers).length > 0 && (
                <div className="typing-indicator">{Object.keys(typingUsers).join(', ')} is typing...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              {replyingTo && (
                <div className="reply-preview">
                  Replying to <strong>{replyingTo.sender}</strong>
                  <button type="button" onClick={() => setReplyingTo(null)}>✖</button>
                </div>
              )}
              <div className="input-row">
                <button type="button" className="btn-attach" onClick={() => fileInputRef.current?.click()}>+</button>
                <input 
                  type="text" 
                  placeholder={`Message #${activeChannel}`} 
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    if (socketRef.current) socketRef.current.emit('typing-indicator', { channelKey: `chat-${activeServer}-${activeChannel}`, username: profile.username, isTyping: true });
                  }}
                />
                <button type="button" className="btn-emoji" onClick={() => setInputMessage(prev => prev + ' 👍')}>😀</button>
                <button type="submit" className="btn-send">Send</button>
              </div>
            </form>
          </div>
        )}

        {/* ─── RIGHT DRAWER: MEMBERS & PINS ─── */}
        {(activeServer !== 'home' && activeServer !== 'discovery') && (
          <div className="side-drawer members-drawer glass-panel">
            {showPinned ? (
              <>
                <div className="drawer-header">PINNED MESSAGES</div>
                <div className="pinned-messages-list" style={{ overflowY: 'auto', padding: '0 16px' }}>
                  {pinnedMessages.length === 0 ? (
                    <div style={{ color: '#b5bac1', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>No pinned messages.</div>
                  ) : (
                    pinnedMessages.map(msg => (
                      <div key={msg.id} style={{ background: '#1e1f22', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '20px', width: '20px', height: '20px', display: 'inline-block', overflow: 'hidden' }}>{renderAvatar(msg.avatar)}</span>
                          <strong className={`role-${getRole(msg.sender)}`}>{msg.sender}</strong>
                        </div>
                        <div style={{ color: '#dbdee1', fontSize: '14px' }}>{msg.text}</div>
                        <button style={{ background: 'transparent', border: 'none', color: '#80848e', marginTop: '8px', cursor: 'pointer', fontSize: '12px' }} onClick={() => handleTogglePin(msg)}>Unpin</button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="drawer-header">MEMBERS</div>
                <div className="channel-category">ONLINE</div>
                <div className="member-item">
                  <div className="member-avatar" style={{ overflow: 'hidden' }}>
                    {renderAvatar(profile.avatar)}
                    <div className="status-dot"></div>
                  </div>
                  <div className="member-name">
                    <span className={`role-${myRole}`}>{profile.username}</span> (You)
                  </div>
                  {profile.customStatus && <div className="member-custom-status">{profile.customStatus}</div>}
                </div>

                {members.filter(id => id !== profile.username).map((id, idx) => (
                  <div className="member-item" key={idx}>
                    <div className="member-avatar">👽<div className="status-dot"></div></div>
                    <div className="member-name"><span className="role-member">{id}</span></div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {showSettings && <SettingsModal profile={profile} onClose={() => setShowSettings(false)} />}
      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} onSubmit={handleCreateServer} />}
      {showCreateChannel && <CreateChannelModal serverId={activeServer} onClose={() => setShowCreateChannel(false)} onSubmit={handleCreateChannel} />}
    </div>
  );
}

export default App;
