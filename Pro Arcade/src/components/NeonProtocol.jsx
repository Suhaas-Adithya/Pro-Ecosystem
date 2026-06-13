import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export default function NeonProtocol({ onExit, isOffline = false }) {
  const [gameState, setGameState] = useState('menu'); // menu, queue, playing
  const [role, setRole] = useState(null); // host, guest, singleplayer
  const [matchId, setMatchId] = useState(null);
  const [score, setScore] = useState({ host: 0, guest: 0 });
  
  const socketRef = useRef(null);
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  
  const paddleRef = useRef(150); // my paddle Y
  const enemyRef = useRef(150);  // enemy paddle Y
  
  const ballRef = useRef({ x: 300, y: 200, dx: 4, dy: 4 });
  const keys = useRef({});

  useEffect(() => {
    if (isOffline) return; // Don't connect sockets if offline mode

    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('arcade-start', (data) => {
      setMatchId(data.matchId);
      setRole(data.role);
      setGameState('playing');
    });

    socketRef.current.on('arcade-sync', (data) => {
      if (data.type === 'guest-move') {
        enemyRef.current = data.y;
      } else if (data.type === 'host-sync') {
        enemyRef.current = data.y;
        ballRef.current = data.ball;
        setScore(data.score);
      }
    });

    return () => socketRef.current.disconnect();
  }, [isOffline]);

  const joinQueue = () => {
    setGameState('queue');
    socketRef.current.emit('arcade-join');
  };

  const startOffline = () => {
    setRole('singleplayer');
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const handleKeyDown = (e) => { keys.current[e.key] = true; };
    const handleKeyUp = (e) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const update = () => {
      // Movement
      if (keys.current['ArrowUp'] || keys.current['w']) {
        paddleRef.current = Math.max(0, paddleRef.current - 5);
      }
      if (keys.current['ArrowDown'] || keys.current['s']) {
        paddleRef.current = Math.min(300, paddleRef.current + 5);
      }

      // AI Movement (if offline)
      if (role === 'singleplayer') {
        const targetY = ballRef.current.y - 50;
        if (enemyRef.current < targetY - 10) enemyRef.current += 3;
        else if (enemyRef.current > targetY + 10) enemyRef.current -= 3;
        enemyRef.current = Math.max(0, Math.min(300, enemyRef.current));
      }

      // Host or Singleplayer computes ball physics
      if (role === 'host' || role === 'singleplayer') {
        let b = ballRef.current;
        b.x += b.dx;
        b.y += b.dy;

        if (b.y <= 0 || b.y >= 390) b.dy *= -1;

        // Collision with Left Paddle (Host/Player)
        if (b.x <= 20 && b.y >= paddleRef.current && b.y <= paddleRef.current + 100) {
          b.dx *= -1; b.x = 20;
          b.dx *= 1.05; // speed up slightly
        }
        // Collision with Right Paddle (Guest/AI)
        if (b.x >= 570 && b.y >= enemyRef.current && b.y <= enemyRef.current + 100) {
          b.dx *= -1; b.x = 570;
          b.dx *= 1.05;
        }

        // Scoring
        if (b.x < 0) {
          setScore(s => ({ ...s, guest: s.guest + 1 }));
          b.x = 300; b.y = 200; b.dx = 4; b.dy = 4;
        } else if (b.x > 600) {
          setScore(s => ({ ...s, host: s.host + 1 }));
          b.x = 300; b.y = 200; b.dx = -4; b.dy = -4;
        }

        ballRef.current = b;
        
        if (role === 'host') {
          socketRef.current.emit('arcade-state', { matchId, type: 'host-sync', y: paddleRef.current, ball: b, score });
        }
      } else if (role === 'guest') {
        // Guest just sends paddle pos
        socketRef.current.emit('arcade-state', { matchId, type: 'guest-move', y: paddleRef.current });
      }

      // Render
      ctx.clearRect(0, 0, 600, 400);
      
      // Draw Net
      ctx.setLineDash([10, 10]);
      ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(300, 400);
      ctx.strokeStyle = '#333'; ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'hsl(271, 91%, 65%)';
      ctx.shadowColor = 'rgba(139, 92, 246, 0.8)';
      ctx.shadowBlur = 15;

      // Draw Paddles
      const hostY = (role === 'host' || role === 'singleplayer') ? paddleRef.current : enemyRef.current;
      const guestY = (role === 'guest') ? paddleRef.current : enemyRef.current;
      
      ctx.fillRect(10, hostY, 10, 100);
      ctx.fillRect(580, guestY, 10, 100);

      // Draw Ball
      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      gameLoopRef.current = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, role, matchId]); // removed score dependency to prevent constant react re-renders

  return (
    <div className="neon-protocol-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff' }}>
      <button onClick={onExit} style={{ position: 'absolute', top: 20, left: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
        &larr; Back to Arcade
      </button>

      <h1 style={{ marginBottom: 40, color: 'hsl(271, 91%, 65%)', textShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }}>Neon Protocol</h1>

      {gameState === 'menu' && (
        <div className="menu-box" style={{ background: '#18181b', padding: 40, borderRadius: 12, textAlign: 'center' }}>
          <h2>MODE SELECT</h2>
          {!isOffline && <button className="join-btn" onClick={joinQueue} style={{ marginTop: 20 }}>FIND ONLINE OPPONENT</button>}
          <button className="join-btn" onClick={startOffline} style={{ marginTop: 20, background: '#3b82f6' }}>PLAY vs AI</button>
        </div>
      )}

      {gameState === 'queue' && (
        <div className="menu-box" style={{ background: '#18181b', padding: 40, borderRadius: 12, textAlign: 'center' }}>
          <h2>SEARCHING MESH FOR CHALLENGERS...</h2>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-wrapper" style={{ position: 'relative' }}>
          <div className="score-board" style={{ position: 'absolute', top: 20, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 40, fontSize: 32, fontWeight: 'bold', zIndex: 10 }}>
            <span style={{ color: (role === 'host' || role === 'singleplayer') ? 'hsl(271, 91%, 65%)' : '#555' }}>{score.host}</span>
            <span>-</span>
            <span style={{ color: role === 'guest' ? 'hsl(271, 91%, 65%)' : '#555' }}>{score.guest}</span>
          </div>
          <canvas ref={canvasRef} width={600} height={400} style={{ border: '1px solid #333', borderRadius: 8, background: '#000' }}></canvas>
          <div className="controls-hint" style={{ textAlign: 'center', marginTop: 16, color: '#888' }}>USE [W] / [S] OR ARROW KEYS TO MOVE</div>
        </div>
      )}
    </div>
  );
}
