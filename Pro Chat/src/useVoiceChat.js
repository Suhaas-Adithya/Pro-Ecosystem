import { useEffect, useRef, useState } from 'react';

export default function useVoiceChat(socketRef, activeChannel, profile) {
  const [inVoice, setInVoice] = useState(false);
  const [audioStreams, setAudioStreams] = useState({}); // peerId -> stream
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenEnabled, setScreenEnabled] = useState(false);
  
  const localStream = useRef(null);
  const peers = useRef({});

  useEffect(() => {
    return () => leaveVoice();
  }, []);

  const startVoice = async (channelId) => {
    try {
      if (!socketRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      setInVoice(true);

      socketRef.current.emit('join-room', { roomId: channelId });

      socketRef.current.on('room-users', (users) => {
        users.forEach(userId => {
          const peer = createPeer(userId, socketRef.current.id, stream);
          peers.current[userId] = peer;
        });
      });

      socketRef.current.on('user-connected', (userId) => {
        // Wait for offer
      });

      socketRef.current.on('signal', async (payload) => {
        const { callerID, signal } = payload;
        let peer = peers.current[callerID];
        
        if (signal.type === 'offer') {
          peer = addPeer(payload.signal, callerID, localStream.current);
          peers.current[callerID] = peer;
        } else if (peer) {
          if (signal.type === 'answer') {
            await peer.setRemoteDescription(new RTCSessionDescription(signal));
          } else if (signal.candidate) {
            await peer.addIceCandidate(new RTCIceCandidate(signal));
          }
        }
      });

      socketRef.current.on('user-disconnected', (userId) => {
        if (peers.current[userId]) {
          peers.current[userId].close();
          delete peers.current[userId];
        }
        setAudioStreams(prev => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      });

    } catch (err) {
      console.error('Failed to get audio stream:', err);
      alert('Microphone access denied.');
    }
  };

  const toggleVideo = async () => {
    if (!localStream.current) return;
    
    if (videoEnabled) {
      // Turn off video
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream.current.removeTrack(videoTrack);
        
        // Remove track from all peers
        Object.values(peers.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) peer.removeTrack(sender);
        });
      }
      setVideoEnabled(false);
    } else {
      // Turn on video
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = vStream.getVideoTracks()[0];
        localStream.current.addTrack(videoTrack);
        
        Object.values(peers.current).forEach(peer => {
          peer.addTrack(videoTrack, localStream.current);
        });
        setVideoEnabled(true);
        setScreenEnabled(false);
      } catch (e) {
        console.error("Camera access failed:", e);
      }
    }
  };

  const toggleScreen = async () => {
    if (!localStream.current) return;
    
    if (screenEnabled) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream.current.removeTrack(videoTrack);
        Object.values(peers.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) peer.removeTrack(sender);
        });
      }
      setScreenEnabled(false);
    } else {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = sStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          toggleScreen(); // auto revert when user stops sharing
        };
        
        localStream.current.addTrack(screenTrack);
        
        Object.values(peers.current).forEach(peer => {
          peer.addTrack(screenTrack, localStream.current);
        });
        
        setScreenEnabled(true);
        setVideoEnabled(false);
      } catch (e) {
        console.error("Screen share failed:", e);
      }
    }
  };

  const leaveVoice = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
    }
    Object.values(peers.current).forEach(peer => peer.close());
    peers.current = {};
    setAudioStreams({});
    setInVoice(false);
    setVideoEnabled(false);
    setScreenEnabled(false);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', { userToSignal, callerID, signal: event.candidate });
      }
    };

    peer.onnegotiationneeded = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socketRef.current.emit('signal', { userToSignal, callerID, signal: peer.localDescription });
      } catch (err) {
        console.error(err);
      }
    };

    peer.ontrack = (event) => {
      setAudioStreams(prev => ({ ...prev, [userToSignal]: event.streams[0] }));
    };

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('signal', { userToSignal: callerID, callerID: socketRef.current.id, signal: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      setAudioStreams(prev => ({ ...prev, [callerID]: event.streams[0] }));
    };

    peer.setRemoteDescription(new RTCSessionDescription(incomingSignal)).then(async () => {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socketRef.current.emit('signal', { userToSignal: callerID, callerID: socketRef.current.id, signal: peer.localDescription });
    });

    return peer;
  };

  return { 
    inVoice, 
    startVoice, 
    leaveVoice, 
    audioStreams, 
    localStream: localStream.current,
    videoEnabled,
    screenEnabled,
    toggleVideo,
    toggleScreen
  };
}
