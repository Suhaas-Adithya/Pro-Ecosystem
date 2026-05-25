import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppearance } from '../contexts/AppearanceContext';
import { getUserMeetings, getUserPersistentRooms, createPersistentRoom, clearUserHistory } from '../hooks/useMeetingStore';
import { updateUserProfile } from '../firebase';
import { isProUser } from '../pro';
import {
  LogOut, Video, Keyboard, ChevronLeft, ChevronRight,
  Calendar, Phone, Menu, HelpCircle, MessageSquareWarning,
  Settings, Grip, X, Star, Lock, Users,
  Bell, BellOff, User, Check, PhoneCall, PhoneIncoming, PhoneMissed, Clock, Cloud, DoorOpen, Copy, Plus,
  Zap, Hourglass, Smartphone, Circle, Info, Loader2, CheckCircle, Trash2, Shield, Sparkles,
  Key, ShieldCheck, RefreshCw, Volume2, Monitor, Mic
} from 'lucide-react';

// ─── Slide data for the carousel ────────────────────────────────────────────
const SLIDES = [
  {
    img: '/illustration.png',
    title: 'Collaborate in real time',
    desc: 'Meet face-to-face from anywhere with crystal-clear P2P video.',
  },
  {
    img: '/illustration2.png',
    title: 'End-to-End Encrypted',
    desc: 'Every call is protected by DTLS-SRTP. No server ever sees your media.',
  },
  {
    img: '/illustration3.png',
    title: 'Built for teams',
    desc: 'Connect up to 10 peers simultaneously with our mesh WebRTC architecture.',
  },
];


// ─── Overlay backdrop ────────────────────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(5,5,15,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── Panel shell ─────────────────────────────────────────────────────────────
function Panel({ title, onClose, children, width = '480px', padding = 'var(--app-padding)' }) {
  return (
    <div className="glass-panel" style={{ width, maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--app-padding) var(--app-padding) 10px var(--app-padding)' }}>
        <h2 className="glow-text" style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding }}>
        {children}
      </div>
    </div>
  );
}

// ─── HELP PANEL ──────────────────────────────────────────────────────────────
function HelpPanel({ onClose }) {
  const shortcuts = [
    ['Ctrl + D', 'Toggle microphone'],
    ['Ctrl + E', 'Toggle camera'],
    ['Ctrl + Shift + H', 'Hang up'],
    ['Ctrl + Shift + S', 'Start screen share'],
    ['Ctrl + Shift + C', 'Open chat'],
  ];
  const faqs = [
    { q: 'Is my call really private?', a: 'Yes. All media is encrypted with DTLS-SRTP end-to-end. Our signaling server only exchanges session metadata briefly at connection time and never handles media.' },
    { q: 'Do I need an account?', a: 'A Google account is required to create or join meetings, protecting rooms from anonymous abuse.' },
    { q: 'How many people can join?', a: 'Up to 10 participants via a full P2P mesh. Beyond that, a selective forwarding unit would be needed.' },
    { q: 'Can I share my screen?', a: 'Yes — click the Screen Share button in the control bar inside a room. It hot-swaps your video track without renegotiating the connection.' },
  ];
  return (
    <Panel title="Help & Shortcuts" onClose={onClose} width="520px">
      <section>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Keyboard Shortcuts</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map(([key, action]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{action}</span>
              <kbd style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid var(--neon-blue)', color: 'var(--neon-blue)', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'monospace' }}>{key}</kbd>
            </div>
          ))}
        </div>
      </section>
      <section>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>FAQ</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map(({ q, a }) => (
            <details key={q} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', color: 'white', fontWeight: 500 }}>{q}</summary>
              <p style={{ color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6, fontSize: '0.95rem' }}>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </Panel>
  );
}

// ─── FEEDBACK PANEL ──────────────────────────────────────────────────────────
function FeedbackPanel({ onClose, currentUser }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover]   = useState(0);
  const [text, setText]     = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setStatus('sending');
    try {
      await fetch(import.meta.env.VITE_FEEDBACK_WEBHOOK, {
        method: 'POST',
        // Google Apps Script requires text/plain to avoid a CORS preflight
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          rating,
          comment: text.trim(),
          user: currentUser?.email || 'Anonymous',
          app: 'Conferencing',
        }),
      });
      setStatus('sent');
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error('Feedback error:', err);
      setStatus('error');
    }
  };

  if (status === 'sent') return (
    <Panel title="Thank you!" onClose={onClose} width="420px">
      <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0,240,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--neon-blue)' }}>
          <Check size={28} color="var(--neon-blue)" />
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Your feedback has been saved. Thank you for helping us improve <strong style={{ color: 'white' }}>Conferencing</strong>!</p>
      </div>
    </Panel>
  );

  return (
    <Panel title="Send Feedback" onClose={onClose} width="440px">
      <p style={{ color: 'var(--text-secondary)', marginTop: '-10px' }}>How would you rate your experience so far?</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', padding: '8px 0' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            size={36}
            fill={(hover || rating) >= n ? '#f5c518' : 'transparent'}
            color={(hover || rating) >= n ? '#f5c518' : 'rgba(255,255,255,0.2)'}
            style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
          />
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Tell us more (optional)…"
          rows={4}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', padding: '14px', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
        />
        {status === 'error' && (
          <p style={{ color: '#ff3366', fontSize: '0.9rem', textAlign: 'center' }}>Something went wrong. Please try again.</p>
        )}
        <button
          type="submit" className="primary"
          disabled={rating === 0 || status === 'sending'}
          style={{ padding: '14px', opacity: (rating === 0 || status === 'sending') ? 0.5 : 1, cursor: (rating === 0 || status === 'sending') ? 'not-allowed' : 'pointer' }}
        >
          {status === 'sending' ? 'Sending…' : 'Submit Feedback'}
        </button>
      </form>
    </Panel>
  );
}

function SettingsPanel({ onClose, currentUser }) {
  const { changePassword, enroll2FA, remove2FA, check2FAStatus: get2FAStatus } = useAuth();
  const { theme, setTheme, density, setDensity } = useAppearance();
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'video' | 'history' | 'general'
  
  // Account / General States
  const [displayName, setDisplayName]     = useState(currentUser?.displayName || '');
  const [notifications, setNotifications] = useState(true);
  const [blockRecording, setBlockRecording] = useState(() => localStorage.getItem('pro_blockRecording') === 'true');
  const [leaveEmpty, setLeaveEmpty]       = useState(true);
  const [saved, setSaved]                 = useState(false);
  const [showPassChange, setShowPassChange] = useState(false);
  const [curPass, setCurPass]             = useState('');
  const [newPass, setNewPass]             = useState('');
  const [confirmPass, setConfirmPass]     = useState('');
  const [passError, setPassError]         = useState('');
  const [passLoading, setPassLoading]     = useState(false);

  // Media Devices States
  const [devices, setDevices]             = useState({ audioinput: [], audiooutput: [], videoinput: [] });
  const [micMeter, setMicMeter]           = useState(0);
  const [previewStream, setPreviewStream] = useState(null);
  const previewVideoRef                   = useRef(null);
  const audioContextRef                  = useRef(null);
  const analyserRef                      = useRef(null);
  const animationFrameRef                = useRef(null);

  // 2FA State
  const [is2FAEnabled, setIs2FAEnabled]   = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(0);
  const [mfaSecret, mfaSetSecret]         = useState('');
  const [mfaCode, setMfaCode]             = useState('');
  const [mfaError, setMfaError]           = useState('');
  const [mfaLoading, setMfaLoading]       = useState(false);
  const [isMfaFetching, setIsMfaFetching] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsMfaFetching(true);
      try {
        const enabled = await get2FAStatus();
        setIs2FAEnabled(enabled);
      } finally {
        setIsMfaFetching(false);
      }
    };
    fetchStatus();
    
    // Fetch Devices
    navigator.mediaDevices.enumerateDevices().then(ds => {
      const categorized = { audioinput: [], audiooutput: [], videoinput: [] };
      ds.forEach(d => categorized[d.kind]?.push(d));
      setDevices(categorized);
    });

    return () => {
      if (previewStream) previewStream.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [get2FAStatus]);

  // Audio Meter Logic
  useEffect(() => {
    if (activeTab === 'audio') {
      startMicLevel();
    } else {
      stopMicLevel();
    }
  }, [activeTab]);

  // Video Preview Logic
  useEffect(() => {
    if (activeTab === 'video') {
      startCameraPreview();
    } else {
      stopCameraPreview();
    }
  }, [activeTab]);

  const startMicLevel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((p, c) => p + c, 0) / bufferLength;
        setMicMeter(average);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (err) { console.error("Mic access failed", err); }
  };

  const stopMicLevel = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const startCameraPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setPreviewStream(stream);
      if (previewVideoRef.current) previewVideoRef.current.srcObject = stream;
    } catch (err) { console.error("Camera access failed", err); }
  };

  const stopCameraPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(t => t.stop());
      setPreviewStream(null);
    }
  };

  const testSpeaker = () => {
    const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
    audio.play();
  };

  const generateMfaSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
       secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    mfaSetSecret(secret);
    setTwoFactorStep(2);
  };

  const handleEnroll2FA = async (e) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError("");
    try {
      await enroll2FA(mfaSecret, mfaCode);
      setIs2FAEnabled(true);
      setTwoFactorStep(0);
      setMfaCode('');
      alert("2FA Enabled Successfully!");
    } catch (err) {
      setMfaError("Invalid code. Please try again.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (confirm("Are you sure you want to disable 2FA? Account security will be reduced.")) {
      await remove2FA();
      setIs2FAEnabled(false);
    }
  };

  const handleSave = async () => {
    if (displayName !== currentUser.displayName) {
      await updateUserProfile(currentUser, { displayName });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    try {
      await changePassword(curPass, newPass);
      setShowPassChange(false);
      alert("Password updated!");
    } catch (err) { setPassError("Update failed."); }
    setPassLoading(false);
  };

  return (
    <Panel title="Settings" onClose={onClose} width="840px" padding="0">
      <div style={{ display: 'flex', minHeight: '480px' }}>
        {/* Sidebar */}
        <div style={{ width: '220px', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { id: 'audio', label: 'Audio', icon: <Volume2 size={18} /> },
            { id: 'video', label: 'Video', icon: <Video size={18} /> },
            { id: 'history', label: 'Call history', icon: <Clock size={18} /> },
            { id: 'appearance', label: 'Appearance', icon: <Sparkles size={18} /> },
            { id: 'general', label: 'General', icon: <Settings size={18} /> },
          ].map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.2s',
                backgroundColor: activeTab === tab.id ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                color: activeTab === tab.id ? 'var(--neon-blue)' : 'var(--text-secondary)'
              }}
              onMouseOver={e => !activeTab === tab.id && (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
              onMouseOut={e => !activeTab === tab.id && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {tab.icon}
              <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{tab.label}</span>
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', maxHeight: '70vh' }}>
          
          {activeTab === 'audio' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.2s' }}>
              <section>
                <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Microphone</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <select className="text-input" style={{ flex: 1, padding: '12px' }}>
                     {devices.audioinput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,5)}`}</option>)}
                   </select>
                   <div style={{ width: '120px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #00f0ff, #00e6a8)', width: `${Math.min(100, (micMeter / 60) * 100)}%`, transition: 'width 0.1s' }} />
                   </div>
                </div>
              </section>

              <section>
                <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Speaker</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <select className="text-input" style={{ flex: 1, padding: '12px' }}>
                     {devices.audiooutput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0,5)}`}</option>)}
                   </select>
                   <button onClick={testSpeaker} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>Test</button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'video' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.2s' }}>
              <section>
                <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Camera</label>
                <select className="text-input" style={{ width: '100%', padding: '12px', marginBottom: '20px' }}>
                  {devices.videoinput.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,5)}`}</option>)}
                </select>
                <div style={{ width: '100%', aspectRatio: '16/9', background: 'black', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                   <video ref={previewVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   {!previewStream && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Camera starting...</div>}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.2s' }}>
              <section>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>Call history management</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Control how your meeting records and history are stored.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>Delete call history</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Permanently wipe everything from your history tab.</p>
                      </div>
                      <button onClick={async () => { await clearUserHistory(currentUser.email); alert("History cleared!"); }} style={{ padding: '10px 18px', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '10px', color: '#ff3366', fontWeight: 600, cursor: 'pointer' }}>Delete history</button>
                   </div>

                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
                      <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>Export call history</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Download a package of your meeting logs and summaries.</p>
                      </div>
                      <button onClick={() => alert("Generating CSV...")} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Export history</button>
                   </div>

                   <div>
                      <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '10px' }}>Autodelete call history</label>
                      <select className="text-input" style={{ width: '100%', padding: '12px' }}>
                         <option>Never</option>
                         <option>After 30 days</option>
                         <option>After 90 days</option>
                      </select>
                   </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', animation: 'fadeIn 0.2s' }}>
              <section>
                <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Theme</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div 
                    onClick={() => setTheme('dark')}
                    style={{ padding: '20px', borderRadius: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid', borderColor: theme === 'dark' ? 'var(--neon-blue)' : 'rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a1a2e', margin: '0 auto 12px auto', border: '2px solid' }}></div>
                    <span style={{ fontWeight: 600, color: theme === 'dark' ? 'white' : 'var(--text-secondary)' }}>Dark Theme</span>
                  </div>
                  <div 
                    onClick={() => setTheme('light')}
                    style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid', borderColor: theme === 'light' ? 'var(--neon-blue)' : 'rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffffff', margin: '0 auto 12px auto', border: '1px solid #ddd' }}></div>
                    <span style={{ fontWeight: 600, color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>White Theme</span>
                  </div>
                </div>
              </section>

              <section>
                <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Layout Density</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div 
                    onClick={() => setDensity('spacious')}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: density === 'spacious' ? 'var(--neon-blue)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--neon-blue)', background: density === 'spacious' ? 'var(--neon-blue)' : 'transparent' }}></div>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>Spacious</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Maximum breathing room, cinematic feel</p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setDensity('congested')}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: density === 'congested' ? 'var(--neon-blue)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--neon-blue)', background: density === 'congested' ? 'var(--neon-blue)' : 'transparent' }}></div>
                    <div>
                      <p style={{ fontWeight: 600, margin: 0 }}>Congested</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Compact layout, more items visible per screen</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.2s' }}>
               <section>
                  <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Account</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                     <img src={currentUser?.photoURL || '/logo.png'} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                     <div>
                        <input className="text-input" value={displayName} onChange={e => setDisplayName(e.target.value)} style={{ padding: '8px 0', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', borderRadius: 0 }} />
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{currentUser?.email}</p>
                     </div>
                  </div>
                  <button onClick={handleSave} style={{ width: '100%', padding: '12px', background: 'var(--neon-blue)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer' }}>{saved ? '✓ Profile Updated' : 'Save Profile'}</button>
               </section>

               <section>
                  <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Privacy & Features</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <span>Block Meeting Recordings</span>
                        <div onClick={() => setBlockRecording(!blockRecording)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: blockRecording ? '#ff3366' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                           <div style={{ position: 'absolute', top: '2px', left: blockRecording ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }} />
                        </div>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <span>Desktop notifications</span>
                        <div onClick={() => setNotifications(!notifications)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: notifications ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                           <div style={{ position: 'absolute', top: '2px', left: notifications ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }} />
                        </div>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                        <span>Leave empty calls</span>
                        <div onClick={() => setLeaveEmpty(!leaveEmpty)} style={{ width: '40px', height: '22px', borderRadius: '11px', background: leaveEmpty ? 'var(--neon-blue)' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer' }}>
                           <div style={{ position: 'absolute', top: '2px', left: leaveEmpty ? '20px' : '2px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s' }} />
                        </div>
                     </div>
                  </div>
               </section>

               <section>
                  <label style={{ display: 'block', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '16px' }}>Two-Factor Authentication</label>
                  <div style={{ padding: '20px', background: is2FAEnabled ? 'rgba(0, 230, 168, 0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid', borderColor: is2FAEnabled ? 'rgba(0, 230, 168, 0.2)' : 'rgba(255,255,255,0.06)', borderRadius: '16px' }}>
                     {/* ... same 2FA logic moved here ... */}
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           {isMfaFetching ? <RefreshCw className="animate-spin" size={20} /> : (is2FAEnabled ? <ShieldCheck color="#00e6a8" /> : <Smartphone />)}
                           <div>
                              <p style={{ fontWeight: 600, margin: 0 }}>{is2FAEnabled ? '2FA Active' : 'Enable 2FA'}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{is2FAEnabled ? 'Account is highly secure' : 'Use Authenticator app for extra security'}</p>
                           </div>
                        </div>
                        {!isMfaFetching && (
                           is2FAEnabled ? <button onClick={handleDisable2FA} style={{ color: '#ff3366', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Disable</button>
                                        : <button onClick={() => setTwoFactorStep(1)} style={{ color: 'var(--neon-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Start setup</button>
                        )}
                     </div>
                     {twoFactorStep > 0 && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                            {/* Simplified 2FA flow here or keeps existing logic */}
                            {twoFactorStep === 1 && <button onClick={generateMfaSecret} className="primary" style={{ width: '100%', padding: '10px' }}>Generate Secret</button>}
                            {twoFactorStep === 2 && (
                               <div style={{ textAlign: 'center' }}>
                                  <img src={`https://quickchart.io/chart?cht=qr&chs=120x120&chl=otpauth://totp/NovaMeet:${currentUser.email}?secret=${mfaSecret}%26issuer=NovaMeet`} style={{ padding: '8px', background: 'white', borderRadius: '10px' }} />
                                  <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>{mfaSecret}</p>
                                  <button onClick={() => setTwoFactorStep(3)} className="primary" style={{ width: '100%', marginTop: '10px' }}>Verified</button>
                               </div>
                            )}
                            {twoFactorStep === 3 && (
                               <div style={{ display: 'flex', gap: '10px' }}>
                                  <input className="text-input" placeholder="000000" value={mfaCode} onChange={e => setMfaCode(e.target.value)} />
                                  <button onClick={handleEnroll2FA} className="primary">Enroll</button>
                               </div>
                            )}
                        </div>
                     )}
                  </div>
               </section>
            </div>
          )}

        </div>
      </div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Panel>
  );
}

// ─── APPS GRID PANEL ─────────────────────────────────────────────────────────
function AppsPanel({ onClose }) {
  const apps = [
    { icon: '📅', name: 'Calendar',   desc: 'Schedule future meetings' },
    { icon: '📝', name: 'Notes',      desc: 'Shared in-meeting notes' },
    { icon: '📊', name: 'Whiteboard', desc: 'Collaborative canvas' },
    { icon: '🗳️', name: 'Polls',      desc: 'Live audience polls' },
    { icon: '🔐', name: 'Vault',      desc: 'Encrypted file transfer' },
    { icon: '🤖', name: 'AI Summary', desc: 'Post-meeting recap' },
  ];
  return (
    <Panel title="Apps & Integrations" onClose={onClose} width="500px">
      <p style={{ color: 'var(--text-secondary)', marginTop: '-10px', fontSize: '0.95rem' }}>Extend your meetings with powerful add-ons. <em style={{opacity:0.6}}>(Coming soon)</em></p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {apps.map(({ icon, name, desc }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)'; e.currentTarget.style.background = 'rgba(0,240,255,0.05)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── MAIN LANDING COMPONENT ──────────────────────────────────────────────────
function Landing() {
  const [roomId, setRoomId]         = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab]   = useState('meetings');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [activePanel, setActivePanel] = useState(null); // 'help' | 'feedback' | 'settings' | 'apps'
  const [recentCalls, setRecentCalls] = useState([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [persistentRooms, setPersistentRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('processing');
  const [showClearHistory, setShowClearHistory] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(null); // call.id

  const navigate                    = useNavigate();
  const { currentUser, logout }     = useAuth();
  const isPro                       = isProUser(currentUser?.email);

  // Live clock – update every minute
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Auto-advance carousel every 6 s
  useEffect(() => {
    const t = setInterval(() => setSlideIndex(i => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  // Pre-fetch calls and rooms immediately on load
  useEffect(() => {
    let active = true;
    if (currentUser?.email) {
      setCallsLoading(true);
      setRoomsLoading(true);
      getUserMeetings(currentUser.email).then(data => {
        if (active) { setRecentCalls(data); setCallsLoading(false); }
      });
      getUserPersistentRooms(currentUser.email).then(data => {
        if (active) { setPersistentRooms(data); setRoomsLoading(false); }
      });
    }
    return () => { active = false; };
  }, [currentUser]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    try {
      const newRoomId = await createPersistentRoom(roomName, currentUser.email);
      const newRoom = { id: newRoomId, name: roomName, hostEmail: currentUser.email };
      setPersistentRooms(prev => [newRoom, ...prev]);
      setShowRoomModal(false);
      setRoomName('');
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  const goSlide = (dir) => setSlideIndex(i => (i + dir + SLIDES.length) % SLIDES.length);

  const handleCheckout = () => {
    setShowCheckout(true);
    setCheckoutStep('processing');
    setTimeout(() => {
      setCheckoutStep('success');
      localStorage.setItem('pro_isPro', 'true');
      setTimeout(() => setShowCheckout(false), 3000);
    }, 2500);
  };

  const executeClearHistory = async () => {
    if (currentUser?.email) {
      await clearUserHistory(currentUser.email);
      setRecentCalls([]);
      setShowClearHistory(false);
    }
  };

  const handleNewMeeting = () => {
    const id = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    navigate(`/room/${id}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) navigate(`/room/${roomId.trim()}`);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const callIcon = (type) => {
    if (type === 'missed')   return <PhoneMissed  size={16} color="#ff3366" />;
    if (type === 'incoming') return <PhoneIncoming size={16} color="var(--neon-blue)" />;
    return                          <PhoneCall    size={16} color="#a0a0c0" />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>

      {/* ── Active overlay panels ── */}
      {activePanel === 'help'     && <Overlay onClose={() => setActivePanel(null)}><HelpPanel     onClose={() => setActivePanel(null)} /></Overlay>}
      {activePanel === 'feedback' && <Overlay onClose={() => setActivePanel(null)}><FeedbackPanel onClose={() => setActivePanel(null)} currentUser={currentUser} /></Overlay>}
      {activePanel === 'settings' && <Overlay onClose={() => setActivePanel(null)}><SettingsPanel onClose={() => setActivePanel(null)} currentUser={currentUser} /></Overlay>}
      {activePanel === 'apps'     && <Overlay onClose={() => setActivePanel(null)}><AppsPanel     onClose={() => setActivePanel(null)} /></Overlay>}
      {showRoomModal && (
        <Overlay onClose={() => setShowRoomModal(false)}>
           <Panel title="Create Persistent Room" onClose={() => setShowRoomModal(false)} width="440px">
              <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 <p style={{ color: 'var(--text-secondary)', marginTop: '-10px', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Give your new room a memorable name. You will be able to join it anytime and it will never expire.
                 </p>
                 <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '8px', fontWeight: 600 }}>Room Name</label>
                    <input autoFocus className="text-input" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="e.g. Engineering Sync" required />
                 </div>
                 <button type="submit" className="primary" style={{ padding: '14px', marginTop: '10px', fontSize: '1rem' }} disabled={!roomName.trim()}>
                    Create Room
                 </button>
              </form>
           </Panel>
        </Overlay>
      )}

      {/* ── Clear History Modal Overlay ── */}
      {showClearHistory && (
        <Overlay onClick={() => setShowClearHistory(false)}>
           <Panel onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 51, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#ff3366' }}>
                 <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Clear Call History?</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: 1.5 }}>
                 Are you sure you want to permanently remove all recorded meetings from your history? Other participants will still retain their records. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '15px' }}>
                 <button onClick={() => setShowClearHistory(false)} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                    Cancel
                 </button>
                 <button onClick={executeClearHistory} style={{ flex: 1, padding: '14px', background: '#ff3366', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(255, 51, 102, 0.3)' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                    Yes, Clear History
                 </button>
              </div>
           </Panel>
        </Overlay>
      )}

      {/* ── Checkout Simulator Overlay ── */}
      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 15, 0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000 }}>
           <div className="glass-panel" style={{ width: '400px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px', boxShadow: '0 20px 80px rgba(233, 59, 110, 0.15)', border: '1px solid rgba(233, 59, 110, 0.2)' }}>
              {checkoutStep === 'processing' ? (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(233, 59, 110, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e93b6e' }}>
                     <Loader2 size={32} style={{ animation: 'spin 1.5s linear infinite' }} />
                  </div>
                  <h3 className="glow-text" style={{ fontSize: '1.6rem', margin: 0, textShadow: '0 0 10px rgba(233,59,110,0.5)' }}>Securing connection...</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>
                     Contacting Stripe Gateway for Conferencing Professional upgrade.
                  </p>
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </>
              ) : (
                <>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 230, 168, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00e6a8' }}>
                     <CheckCircle size={32} />
                  </div>
                  <h3 className="glow-text" style={{ fontSize: '1.6rem', margin: 0, textShadow: '0 0 10px rgba(0,230,168,0.5)' }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>
                     You are now a Conferencing Professional. Welcome aboard.
                  </p>
                </>
              )}
           </div>
        </div>
      )}

      {/* ── Top Nav ── */}
      <div style={{ padding: '12px var(--app-padding)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--app-gap)' }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="icon-btn"
            title="Toggle sidebar"
            style={{ background: 'transparent', border: 'none', width: '42px', height: '42px' }}
          >
            <Menu size={22} color="var(--text-secondary)" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', mixBlendMode: 'screen' }} />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '6px' }}>
            {currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} &bull; {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>

          <button onClick={() => setActivePanel('help')}     className="icon-btn" title="Help"     style={{ background: 'transparent', border: 'none', width: '40px', height: '40px' }}><HelpCircle          size={20} color="var(--text-secondary)" /></button>
          <button onClick={() => setActivePanel('feedback')} className="icon-btn" title="Feedback" style={{ background: 'transparent', border: 'none', width: '40px', height: '40px' }}><MessageSquareWarning size={20} color="var(--text-secondary)" /></button>
          <button onClick={() => setActivePanel('settings')} className="icon-btn" title="Settings" style={{ background: 'transparent', border: 'none', width: '40px', height: '40px' }}><Settings             size={20} color="var(--text-secondary)" /></button>
          <button onClick={() => setActivePanel('apps')}     className="icon-btn" title="Apps"     style={{ background: 'transparent', border: 'none', width: '40px', height: '40px' }}><Grip size={20} color="var(--text-secondary)" /></button>

          <img
            src={currentUser?.photoURL || '/logo.png'}
            alt="Avatar"
            title={`Signed in as ${currentUser?.displayName}`}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)', marginLeft: '4px', cursor: 'pointer' }}
            onClick={() => setActivePanel('settings')}
          />
          <button onClick={handleLogout} className="icon-btn muted" style={{ width: '36px', height: '36px' }} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* Sidebar */}
        <div style={{ width: sidebarOpen ? '240px' : '0', overflow: 'hidden', transition: 'width 0.3s ease', flexShrink: 0 }}>
          <div style={{ width: '240px', paddingTop: 'var(--app-padding)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'meetings', label: 'Meetings', icon: <Calendar size={20} /> },
              { id: 'rooms',    label: 'Rooms',    icon: <DoorOpen size={20} /> },
              { id: 'calls',    label: 'History',  icon: <Clock    size={20} /> },
              { id: 'upgrade',  label: 'Upgrade',  icon: <Zap      size={20} /> },
            ].map(({ id, label, icon }) => (
              <div
                key={id}
                onClick={() => setActiveTab(id)}
                className={`hover-lift ${activeTab === id ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--app-gap)',
                  padding: '12px var(--app-padding)',
                  borderRadius: '0 25px 25px 0',
                  borderLeft: activeTab === id ? '4px solid var(--neon-blue)' : '4px solid transparent',
                  background:  activeTab === id ? 'rgba(0,240,255,0.08)' : 'transparent',
                  color:       activeTab === id ? 'var(--neon-blue)'      : 'var(--text-secondary)',
                  fontWeight:  activeTab === id ? 600 : 400,
                  cursor: 'pointer',
                  fontSize: '0.95rem'
                }}
              >
                {icon}<span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--app-padding)' }}>

          {/* ── MEETINGS TAB (Ad-Hoc) ── */}
          {activeTab === 'meetings' && (
            <div style={{ width: '100%', maxWidth: '720px', textAlign: 'center' }}>
              <h1 className="glow-text" style={{ fontSize: '3.4rem', marginBottom: '18px', letterSpacing: '-1.5px', lineHeight: 1.15 }}>
                Video calls and meetings<br />for everyone
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', marginBottom: '52px', fontWeight: 300, lineHeight: 1.5 }}>
                Connect, collaborate, and celebrate from anywhere<br />with Nova Meet.
              </p>

              {/* Action row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--app-gap)', marginBottom: 'var(--app-padding)', flexWrap: 'wrap' }}>
                <button onClick={handleNewMeeting} className="primary" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 26px', fontSize: '1.1rem' }}>
                  <Video size={20} /><span>New meeting</span>
                </button>

                <form onSubmit={handleJoin} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Keyboard size={18} style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    <input
                      type="text" value={roomId} onChange={e => setRoomId(e.target.value)}
                      placeholder="Enter a code or link" className="text-input"
                      style={{ paddingLeft: '46px', width: '300px', fontSize: '1rem' }}
                    />
                  </div>
                  <button
                    type="submit" disabled={!roomId.trim()}
                    style={{ 
                       background: 'transparent', border: 'none', fontWeight: 800, fontSize: '1.05rem', 
                       cursor: roomId.trim() ? 'pointer' : 'not-allowed', 
                       color: !roomId.trim() ? 'var(--text-secondary)' : 'var(--neon-blue)', 
                       opacity: !roomId.trim() ? 0.3 : 1,
                       padding: '8px 12px', transition: 'all 0.2s',
                       textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    Join
                  </button>
                </form>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '44px' }} />

              {/* Carousel */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px' }}>
                <button onClick={() => goSlide(-1)} className="icon-btn" style={{ width: '42px', height: '42px', background: 'transparent', flexShrink: 0 }}>
                  <ChevronLeft size={22} />
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img key={slideIndex} src={SLIDES[slideIndex].img} alt={SLIDES[slideIndex].title} style={{ width: '88%', height: '88%', objectFit: 'contain', animation: 'fadeIn 0.4s ease' }} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{SLIDES[slideIndex].title}</p>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: '340px', lineHeight: 1.5, fontSize: '0.95rem' }}>{SLIDES[slideIndex].desc}</p>
                  {/* Dot indicators */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {SLIDES.map((_, i) => (
                      <div key={i} onClick={() => setSlideIndex(i)} style={{ width: i === slideIndex ? '22px' : '8px', height: '8px', borderRadius: '4px', background: i === slideIndex ? 'var(--neon-blue)' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }} />
                    ))}
                  </div>
                </div>

                <button onClick={() => goSlide(1)} className="icon-btn" style={{ width: '42px', height: '42px', background: 'transparent', flexShrink: 0 }}>
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
          )}

          {/* ── ROOMS TAB (Persistent) ── */}
          {activeTab === 'rooms' && (
            <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 className="glow-text" style={{ fontSize: '2.2rem', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>Persistent Rooms</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0 }}>Permanent, named digital spaces that never expire. Host recurring meetings perfectly.</p>
                </div>
                <button className="primary" onClick={() => setShowRoomModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', fontSize: '1rem', fontWeight: 600 }}>
                   <Plus size={18} /><span>Create Space</span>
                </button>
              </div>
              
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', margin: '10px 0' }} />

              {roomsLoading ? (
                 <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading your spaces...</div>
              ) : persistentRooms.length === 0 ? (
                 <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <DoorOpen size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>No Rooms Yet</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Create a permanent space for your team above to get started.</p>
                 </div>
              ) : (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                    {persistentRooms.map((room) => (
                       <div key={room.id} className="glass-panel" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'all 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                          <div style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(0,240,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><DoorOpen size={16} color="var(--neon-blue)" /></div>
                                <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 600 }}>{room.name}</h3>
                             </div>
                             <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={12}/> Created {room.createdAt?.toDate ? room.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                             <button className="primary" onClick={() => navigate(`/room/${room.id}`)} style={{ flex: 1, padding: '12px', fontSize: '0.95rem', fontWeight: 600 }}>
                                Join Space
                             </button>
                             <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`); alert('Room Link strictly copied to clipboard!'); }} style={{ padding: '0 18px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'} title="Copy Link">
                                <Copy size={18} />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
            </div>
          )}

          {/* ── CALLS/HISTORY TAB ── */}
          {activeTab === 'calls' && (
            <div style={{ width: '100%', maxWidth: '640px' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <h2 style={{ fontSize: '1.8rem', fontWeight: 600, margin: 0 }}>Recent Calls</h2>
                 {recentCalls.length > 0 && (
                   <button onClick={() => setShowClearHistory(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '10px', color: '#ff3366', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 51, 102, 0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 51, 102, 0.1)'}>
                      <Trash2 size={16} /> Clear History
                   </button>
                 )}
               </div>
              {callsLoading ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
              ) : recentCalls.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No recent calls found. Start a meeting to see history here.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {recentCalls.map((call) => (
                    <div key={call.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s', overflow: 'hidden' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                      onMouseOut={e  => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                    >
                      {/* Main row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Users size={20} color="var(--text-secondary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600, marginBottom: '3px', color: 'var(--text-primary)' }}>
                            Room: {call.id.substring(0, 8)}...
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <Clock size={14} color="gray" />
                            <span>{call.startedAt ? new Date(call.startedAt.toDate()).toLocaleString() : 'Recent'}</span>
                            {call.durationSec && <span>&bull; {Math.round(call.durationSec / 60)} min</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {/* AI Summary toggle button — only if summary exists */}
                          {call.aiSummary && (
                            <button
                              onClick={() => setExpandedSummary(expandedSummary === call.id ? null : call.id)}
                              title="AI Meeting Summary"
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: expandedSummary === call.id ? 'rgba(233,59,110,0.2)' : 'rgba(233,59,110,0.08)', border: '1px solid rgba(233,59,110,0.3)', borderRadius: '8px', color: '#e93b6e', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                              onMouseOver={e => e.currentTarget.style.background = 'rgba(233,59,110,0.2)'}
                              onMouseOut={e => e.currentTarget.style.background = expandedSummary === call.id ? 'rgba(233,59,110,0.2)' : 'rgba(233,59,110,0.08)'}
                            >
                              <Sparkles size={14} /> AI Notes
                            </button>
                          )}
                          {call.recordingUrl && (
                            <button
                              onClick={() => window.open(call.recordingUrl, '_blank')}
                              className="icon-btn"
                            >
                              <Play size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Expandable AI Summary Panel */}
                      {call.aiSummary && expandedSummary === call.id && (
                        <div style={{ margin: '0 16px 16px 16px', padding: '16px 20px', background: 'rgba(233,59,110,0.04)', border: '1px solid rgba(233,59,110,0.15)', borderRadius: '12px', animation: 'fadeIn 0.25s ease' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Sparkles size={16} color="#e93b6e" />
                            <span style={{ color: '#e93b6e', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>AI Meeting Notes</span>
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(233,59,110,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Conferencing Pro</span>
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                            {call.aiSummary}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLANS / UPGRADE TAB ── */}
          {activeTab === 'upgrade' && (
            <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', paddingTop: '20px' }}>
               
               {/* Free Tier Card */}
               <div className="glass-panel" style={{ width: '340px', padding: '35px', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 25px 0', color: 'var(--text-primary)' }}>Free</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Hourglass size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>90 minutes per meeting</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Up to 75 participants</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 240, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', margin: '0 -14px' }}>
                        <Video size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>One active meeting at a time</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Smartphone size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Up to 10 meetings per day</span>
                     </div>
                  </div>
               </div>

               {/* Conferencing Professional Tier Card */}
               <div style={{ width: '380px', position: 'relative', background: 'var(--panel-bg)', backdropFilter: 'blur(30px)', padding: '35px', borderRadius: '16px', border: '2px solid #e93b6e', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(233, 59, 110, 0.15)', transform: 'scale(1.02)', transition: 'all 0.3s ease' }}>
                  
                  {/* Recommended Badge */}
                  <div style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', background: '#e93b6e', padding: '6px 20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(233,59,110,0.4)', zIndex: 10 }}>
                     <Star size={16} color="white" fill="transparent" />
                     <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Recommended</span>
                  </div>

                  <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: '10px 0 8px 0', color: 'var(--text-primary)' }}>Conferencing Professional</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', margin: '0 0 25px 0', lineHeight: 1.4 }}>Private video calls for the<br/>conversations that matter.</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 240, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', margin: '0 -14px' }}>
                        <Hourglass size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>12 hours per meeting</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Users size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Up to 5,000 participants</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 240, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', margin: '0 -14px' }}>
                        <Video size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>3 active meetings at a time</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Smartphone size={20} color="#00e6a8" /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Unlimited meetings per day</span>
                     </div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 240, 255, 0.05)', padding: '10px 14px', borderRadius: '8px', margin: '0 -14px' }}>
                        <Circle size={20} color="#00e6a8" strokeWidth={3} /> <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Record meetings up to 3 hours</span> 
                        <div className="info-tooltip-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                           <Info size={16} color="#e93b6e" style={{ marginLeft: '4px', cursor: 'help' }} />
                           <div className="custom-info-tooltip">
                               Recordings are processed via high-performance cloud servers, stored securely in Firebase Cloud Storage, and permanently accessible from your Dashboard History tab.
                           </div>
                        </div>
                     </div>
                  </div>

                  <button onClick={handleCheckout} style={{ background: '#e93b6e', border: 'none', padding: '16px', borderRadius: '12px', color: 'white', fontSize: '1.1rem', fontWeight: 600, marginTop: '20px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(233, 59, 110, 0.3)' }} onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                     From US$7.99 /month
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .sidebar-hover-eff:hover { background: rgba(255,255,255,0.04); color: white; }
        
        .custom-info-tooltip {
           position: absolute; bottom: 120%; left: 50%; transform: translateX(-50%) translateY(10px);
           width: 260px; padding: 12px 16px; background: rgba(15, 15, 25, 0.95); backdrop-filter: blur(10px);
           border: 1px solid rgba(233, 59, 110, 0.3); border-radius: 12px;
           color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; text-align: center;
           box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 100;
           opacity: 0; visibility: hidden; pointer-events: none; transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .info-tooltip-container:hover .custom-info-tooltip {
           opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0);
        }
      `}</style>
    </div>
  );
}

export default Landing;
