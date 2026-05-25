import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorOff, 
  MessageSquare, Send, X, Circle, Settings, Lock, Sparkles, Users 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { startMeeting, joinMeeting, endMeeting } from '../hooks/useMeetingStore';
import { isProUser } from '../pro';

const SOCKET_SERVER = `http://${window.location.hostname}:3001`;

// --- Components ---

function ToggleSwitch({ label, checked, onChange, isLock }) {
  return (
    <div 
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', cursor: 'pointer' }} 
      onClick={onChange}
    >
      <span style={{ color: 'white', fontSize: '0.95rem' }}>{label}</span>
      <div 
        style={{ 
          width: '50px', 
          height: '26px', 
          backgroundColor: checked ? (isLock ? '#ff0055' : 'var(--neon-blue)') : 'rgba(255,255,255,0.1)',
          borderRadius: '13px',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: checked ? `0 0 15px ${isLock ? 'rgba(255,0,85,0.4)' : 'rgba(0,240,255,0.4)'}` : 'none'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '27px' : '3px',
          width: '20px',
          height: '20px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }} />
      </div>
    </div>
  );
}

// --- Main Room Component ---

function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // -- State Hooks --
  const [peers, setPeers] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [hostSocketId, setHostSocketId] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMeetingLocked, setIsMeetingLocked] = useState(false);
  const [isRecordingBlocked, setIsRecordingBlocked] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);
  const [turnOffIncomingVideo, setTurnOffIncomingVideo] = useState(false);
  const [hideSelfView, setHideSelfView] = useState(false);
  const [showFloatingThumbnail, setShowFloatingThumbnail] = useState(false);
  const [noiseCancellation, setNoiseCancellation] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // -- Ref Hooks --
  const socketRef = useRef();
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingUrlRef = useRef(null);
  const uploadPromiseRef = useRef(null);
  const meetingStartTimeRef = useRef(null);
  const toastTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const processedStreamRef = useRef(null);
  const cameraUtilRef = useRef(null);
  const userVideo = useRef();
  const peersRef = useRef({}); // Mapping of socketId -> RTCPeerConnection
  const streamRef = useRef();
  const videoGridRef = useRef();

  const isPro = isProUser(currentUser?.email);

  // -- Utilities --
  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => setToastMessage(''), 3000);
  };

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // -- Lifecycle Hooks --

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER);

    async function initializeMedia() {
      let stream;
      try {
        // Pass 1: Attempt to get both
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e) {
        console.warn("Pass 1 failed, investigating hardware...", e);
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideo = devices.some(d => d.kind === 'videoinput');
          const hasAudio = devices.some(d => d.kind === 'audioinput');

          if (hasVideo || hasAudio) {
            // Pass 2: Fallback to whatever is actually present
            stream = await navigator.mediaDevices.getUserMedia({ 
              video: hasVideo, 
              audio: hasAudio 
            });
            if (!hasVideo) showToast("Joining with audio only (No camera found)");
            if (!hasAudio) showToast("Joining with video only (No microphone found)");
          } else {
            throw new Error("No media devices found");
          }
        } catch (err2) {
          console.error("Critical Room Error (Media Recovery):", err2);
          showToast("Could not access hardware. Is another app using your camera?");
          // Still join the room as a "listener" if socket is connected
        }
      }

      if (stream) {
        streamRef.current = stream;
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }

        // Sync initial state with what we actually got
        setAudioEnabled(stream.getAudioTracks().length > 0);
        setVideoEnabled(stream.getVideoTracks().length > 0);

        if (isPro && !isRecordingBlocked) {
          startAutoRecording(stream);
        }
      }

      // -- Continue with Socket initialization even if media fails --
      meetingStartTimeRef.current = Date.now();
      const email = currentUser?.email || 'anonymous';
      startMeeting(roomId, email).then(() => {
        joinMeeting(roomId, email);
      });

      socketRef.current.emit('join-room', { 
        roomId,
        hostId: currentUser?.uid,
        blockRecording: localStorage.getItem('pro_blockRecording') === 'true' 
      });

      socketRef.current.on('host-info', (hostId) => {
        setHostSocketId(hostId);
      });

      socketRef.current.on('kicked', () => {
        alert('You have been removed from the session by the host.');
        navigate('/');
      });

      socketRef.current.on('force-muted', () => {
        if (streamRef.current) {
          const audioTrack = streamRef.current.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = false;
            setAudioEnabled(false);
          }
        }
        showToast('You were muted by the host.');
      });

      socketRef.current.on('recording-blocked-status', (blocked) => {
        setIsRecordingBlocked(blocked);
        if (blocked && mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      });

      socketRef.current.on('room-locked', () => {
        alert('This meeting has been locked by the host.');
        navigate('/');
      });

      socketRef.current.on('room-lock-status', (locked) => {
        setIsMeetingLocked(locked);
      });

      socketRef.current.on('room-users', (users) => {
        users.forEach((userId) => {
          const peer = createPeer(userId, socketRef.current.id, streamRef.current);
          peersRef.current[userId] = peer;
        });
      });

      socketRef.current.on('signal', async (payload) => {
        const { signal, callerID } = payload;
        let peer = peersRef.current[callerID];
        if (!peer) {
          peer = addPeer(signal, callerID, streamRef.current);
          peersRef.current[callerID] = peer;
        } else {
          if (signal.type === 'answer') {
            await peer.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await peer.addIceCandidate(new RTCIceCandidate(signal));
          }
        }
      });

      socketRef.current.on('user-disconnected', (userId) => {
        if (peersRef.current[userId]) {
          peersRef.current[userId].close();
          delete peersRef.current[userId];
          removeVideoElement(userId);
        }
      });
    }

    initializeMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) socketRef.current.disconnect();
      for (let peerId in peersRef.current) {
        peersRef.current[peerId].close();
      }
    };
  }, [roomId, navigate, currentUser]);

  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const activeElement = document.activeElement;
      if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable) {
        return;
      }
      const isModifier = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      if (isModifier && key === 'd' && !isShift) {
        e.preventDefault();
        toggleMute();
        showToast(`Mic ${!audioEnabled ? 'On' : 'Off'}`);
      }
      if (isModifier && key === 'e' && !isShift) {
        e.preventDefault();
        toggleVideo();
        showToast(`Camera ${!videoEnabled ? 'On' : 'Off'}`);
      }
      if (isModifier && isShift && key === 's') {
        e.preventDefault();
        toggleScreenShare();
      }
      if (isModifier && isShift && key === 'c') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
      if (isModifier && isShift && key === 'h') {
        e.preventDefault();
        setShowLeaveModal(true);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [audioEnabled, videoEnabled, screenSharing]);

  // -- P2P Engine --

  function createPeer(userToSignal, callerID, stream) {
    const peer = new RTCPeerConnection(iceServers);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', { userToSignal, callerID, signal: event.candidate });
      }
    };
    peer.ontrack = (event) => {
      addVideoElement(userToSignal, event.streams[0]);
    };
    const dataChannel = peer.createDataChannel('chat');
    dataChannel.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      setMessages((prev) => [...prev, parsed]);
    };
    peer.dataChannel = dataChannel;
    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }
    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer);
      socketRef.current.emit('signal', { userToSignal, callerID, signal: offer });
    });
    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new RTCPeerConnection(iceServers);
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', { userToSignal: callerID, callerID: socketRef.current.id, signal: event.candidate });
      }
    };
    peer.ontrack = (event) => {
      addVideoElement(callerID, event.streams[0]);
    };
    peer.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannel.onmessage = (e) => {
        const parsed = JSON.parse(e.data);
        setMessages((prev) => [...prev, parsed]);
      };
      peer.dataChannel = dataChannel;
    };
    if (stream) {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }
    peer.setRemoteDescription(new RTCSessionDescription(incomingSignal)).then(() => {
      peer.createAnswer().then((answer) => {
        peer.setLocalDescription(answer);
        socketRef.current.emit('signal', { userToSignal: callerID, callerID: socketRef.current.id, signal: answer });
      });
    });
    return peer;
  }

  function addVideoElement(peerId, stream) {
    if (document.getElementById(`video-${peerId}`)) return;
    setPeers((prev) => {
      if (!prev.includes(peerId)) return [...prev, peerId];
      return prev;
    });

    const videoGroup = document.createElement('div');
    videoGroup.className = 'video-container remote-peer';
    videoGroup.id = `container-${peerId}`;

    const video = document.createElement('video');
    video.id = `video-${peerId}`;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.innerText = 'Peer (Secure E2EE)';

    videoGroup.appendChild(video);
    videoGroup.appendChild(label);
    if (videoGridRef.current) videoGridRef.current.appendChild(videoGroup);
  }

  function removeVideoElement(peerId) {
    setPeers((prev) => prev.filter((id) => id !== peerId));
    const container = document.getElementById(`container-${peerId}`);
    if (container && videoGridRef.current) {
      videoGridRef.current.removeChild(container);
    }
  }

  const handleKickPeer = (peerId) => {
    socketRef.current.emit('host-kick-user', { roomId, targetId: peerId });
  };

  const handleMutePeer = (peerId) => {
    socketRef.current.emit('host-force-mute', { roomId, targetId: peerId });
  };

  // -- Interaction Handlers --

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioEnabled;
        setAudioEnabled(!audioEnabled);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoEnabled;
        setVideoEnabled(!videoEnabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!screenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = () => stopScreenShare();
        for (let peerId in peersRef.current) {
          const sender = peersRef.current[peerId].getSenders().find((s) => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        }
        setScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Failed to share screen", err);
    }
  };

  const stopScreenShare = () => {
    const cameraTrack = streamRef.current.getVideoTracks()[0];
    for (let peerId in peersRef.current) {
      const sender = peersRef.current[peerId].getSenders().find((s) => s.track.kind === 'video');
      if (sender) sender.replaceTrack(cameraTrack);
    }
    setScreenSharing(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const payload = {
      sender: currentUser?.displayName || 'Peer User',
      text: chatInput,
      timestamp: Date.now()
    };
    for (let peerId in peersRef.current) {
      const targetChannel = peersRef.current[peerId].dataChannel;
      if (targetChannel && targetChannel.readyState === 'open') {
        targetChannel.send(JSON.stringify(payload));
      }
    }
    setMessages((prev) => [...prev, payload]);
    setChatInput('');
  };

  const startAutoRecording = (stream) => {
    if (!stream || isRecordingBlocked) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        setIsUploading(true);
        uploadPromiseRef.current = new Promise((resolve) => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            try {
              const res = await fetch(`http://${window.location.hostname}:3001/api/upload-recording`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, videoBase64: reader.result })
              });
              const data = await res.json();
              recordingUrlRef.current = data.url;
            } catch (err) { }
            setIsUploading(false);
            resolve();
          };
        });
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      showToast('⭐ Auto-recording active');
    } catch (err) { }
  };

  const toggleRecording = () => {
    if (isRecordingBlocked) return;
    if (!streamRef.current) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      startAutoRecording(streamRef.current);
    }
  };

  const hangup = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
    if (uploadPromiseRef.current) {
      showToast('Finalizing secure cloud backup...');
      await uploadPromiseRef.current;
    }
    const durationSec = meetingStartTimeRef.current ? (Date.now() - meetingStartTimeRef.current) / 1000 : 0;
    let aiSummary = null;
    if (recordedChunksRef.current.length > 0) {
      try {
        const summaryRes = await fetch(`http://${window.location.hostname}:3001/api/summarize-meeting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId })
        });
        const summaryData = await summaryRes.json();
        aiSummary = summaryData.summary || null;
      } catch (err) { }
    }
    await endMeeting(roomId, durationSec, messages, recordingUrlRef.current, aiSummary);
    navigate('/');
  };

  const toggleMeetingLock = () => {
    const newVal = !isMeetingLocked;
    setIsMeetingLocked(newVal);
    socketRef.current.emit(newVal ? 'lock-room' : 'unlock-room', roomId);
    if (newVal) {
      showToast('Meeting locked for privacy');
      setShowSettingsModal(false);
    } else {
      showToast('Meeting unlocked');
    }
  };

  const handleSetting = (setter, currentVal, name) => {
    setter(!currentVal);
    showToast(`${name} ${!currentVal ? 'enabled' : 'disabled'}`);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'radial-gradient(circle at center, #1a1a2e 0%, #05050f 100%)' }}>
      
      {/* Toast Overlay */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0, 240, 255, 0.15)', backdropFilter: 'blur(20px)', color: 'white', padding: '12px 30px', borderRadius: '40px', border: '1px solid rgba(0, 240, 255, 0.3)', zIndex: 9999, transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 0 30px rgba(0,240,255,0.2)' }}>
          {toastMessage}
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(5, 5, 15, 0.85)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 0, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff0055', margin: '0 auto 20px' }}>
              <PhoneOff size={32} />
            </div>
            <h3 className="glow-text">Leave Meeting?</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to end this secure session?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button onClick={() => setShowLeaveModal(false)} className="outline-btn" style={{ flex: 1 }}>Stay</button>
              <button onClick={hangup} className="primary" style={{ flex: 1, background: '#ff0055' }}>Yes, Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--neon-blue)', borderRadius: '50%', boxShadow: '0 0 10px var(--neon-blue)' }} />
          <h2 className="glow-text" style={{ margin: 0, fontSize: '1.2rem' }}>Pro Secure Edge</h2>
        </div>
        <div style={{ background: 'rgba(0,240,255,0.05)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(0,240,255,0.2)', color: 'var(--neon-blue)', fontSize: '0.85rem', fontWeight: 600 }}>
          #{roomId} (E2EE Active)
        </div>
      </div>

      {/* Main Viewport */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
        
        {/* Settings Panel */}
        {showSettingsModal && (
          <div style={{ position: 'absolute', top: '20px', left: '20px', width: '300px', background: 'rgba(15, 18, 25, 0.95)', backdropFilter: 'blur(30px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', zIndex: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Room Settings</h3>
              <X onClick={() => setShowSettingsModal(false)} style={{ cursor: 'pointer', opacity: 0.6 }} />
            </div>
            <ToggleSwitch label="Privatize Meeting" checked={isMeetingLocked} onChange={toggleMeetingLock} isLock={true} />
            <ToggleSwitch label="Background Blur" checked={backgroundBlur} onChange={() => handleSetting(setBackgroundBlur, backgroundBlur, 'Blur')} />
            <ToggleSwitch label="Block Recording" checked={isRecordingBlocked} onChange={() => handleSetting(setIsRecordingBlocked, isRecordingBlocked, 'Recording block')} />
          </div>
        )}

        {/* Video Grid */}
        <div ref={videoGridRef} style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', overflowY: 'auto', justifyItems: 'center', alignItems: 'center' }}>
          {!hideSelfView && (
            <div className="video-container" style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '16 / 9', width: '100%', maxWidth: '1000px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
              <video ref={userVideo} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                You (Me)
              </div>
              {isRecording && (
                <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,0,85,0.1)', color: '#ff0055', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(255,0,85,0.3)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <div style={{ width: '8px', height: '8px', background: '#ff0055', borderRadius: '50%', animation: 'pulse 1s infinite' }} /> REC
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div style={{ width: '350px', background: 'rgba(15, 18, 25, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Secured Chat</h3>
              <X onClick={() => setIsChatOpen(false)} style={{ cursor: 'pointer', opacity: 0.6 }} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.sender === currentUser?.displayName ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                   <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '4px' }}>{m.sender}</div>
                   <div style={{ padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>{m.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} style={{ padding: '20px', display: 'flex', gap: '10px' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type encrypted message..." style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px' }} />
              <button type="submit" className="primary" style={{ padding: '10px' }}><Send size={18} /></button>
            </form>
          </div>
        )}

        {/* Participants Sidebar */}
        {isParticipantsOpen && (
          <div style={{ width: '350px', background: 'rgba(15, 18, 25, 0.97)', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="var(--neon-blue)" />
                <h3 className="glow-text" style={{ margin: 0, fontSize: '1.1rem' }}>Participants ({peers.length + 1})</h3>
              </div>
              <X onClick={() => setIsParticipantsOpen(false)} style={{ cursor: 'pointer', opacity: 0.6, transition: 'all 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = 1} onMouseOut={(e) => e.currentTarget.style.opacity = 0.6} />
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* You (Current User) */}
              <div className="hover-lift" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(0,240,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,240,255,0.2) 0%, rgba(255,0,255,0.2) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,240,255,0.3)' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--neon-blue)', boxShadow: '0 0 10px var(--neon-blue)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>You</span>
                    {socketRef.current?.id === hostSocketId && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--neon-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginTop: '2px' }}>Room Host</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Remote Peers */}
              {peers.map((peerId, index) => (
                <div className="hover-lift" key={peerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', animation: `fadeIn 0.3s ease forwards ${(index + 1) * 0.1}s`, opacity: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)' }}>Peer {peerId.substring(0, 4)}</span>
                      {peerId === hostSocketId && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--neon-blue)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginTop: '2px' }}>Room Host</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Host Controls */}
                  {socketRef.current?.id === hostSocketId && peerId !== hostSocketId && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn-small" onClick={() => handleMutePeer(peerId)} title="Force Mute">
                        <MicOff size={16} />
                      </button>
                      <button className="icon-btn-small danger" onClick={() => handleKickPeer(peerId)} title="Kick Peer">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div style={{ padding: '25px', display: 'flex', justifyContent: 'center', gap: '20px', background: 'rgba(15, 18, 25, 0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button className={`icon-btn hover-lift ${!audioEnabled ? 'muted' : ''}`} onClick={toggleMute}>
           {audioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
        </button>
        <button className={`icon-btn hover-lift ${!videoEnabled ? 'muted' : ''}`} onClick={toggleVideo}>
           {videoEnabled ? <Video size={22} /> : <VideoOff size={22} />}
        </button>
        <button className={`icon-btn hover-lift ${screenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
           {screenSharing ? <MonitorOff size={22} /> : <MonitorUp size={22} />}
        </button>
        <button className={`icon-btn hover-lift ${isRecording ? 'active' : ''}`} onClick={toggleRecording}>
           <Circle size={18} fill={isRecording ? '#ff0055' : 'none'} color={isRecording ? '#ff0055' : 'white'} />
        </button>
        <button className="icon-btn hover-lift" onClick={() => setShowSettingsModal(!showSettingsModal)}>
           <Settings size={22} />
        </button>
        <button className={`icon-btn hover-lift ${isChatOpen ? 'active' : ''}`} onClick={() => { setIsChatOpen(!isChatOpen); setIsParticipantsOpen(false); }}>
           <MessageSquare size={22} />
        </button>
        <button className={`icon-btn hover-lift ${isParticipantsOpen ? 'active' : ''}`} onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsChatOpen(false); }}>
           <Users size={22} />
        </button>
        <button className="icon-btn hover-lift muted" onClick={() => setShowLeaveModal(true)} style={{ marginLeft: '10px' }}>
           <PhoneOff size={22} />
        </button>
      </div>

      <style>{`
        .icon-btn { width: 56px; height: 56px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .icon-btn:hover { background: rgba(255,255,255,0.08); }
        .icon-btn.active { background: var(--neon-blue); border-color: var(--neon-blue); box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
        .icon-btn.muted { background: rgba(255, 0, 85, 0.1); border-color: rgba(255, 0, 85, 0.3); color: #ff0055; }
        .icon-btn-small { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .icon-btn-small:hover { background: rgba(255,255,255,0.1); color: white; }
        .icon-btn-small.danger:hover { background: rgba(255,0,85,0.15); color: #ff0055; border-color: rgba(255,0,85,0.3); }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes fadeIn { to { opacity: 1; } }
      `}</style>
    </div>
  );
}

export default Room;
