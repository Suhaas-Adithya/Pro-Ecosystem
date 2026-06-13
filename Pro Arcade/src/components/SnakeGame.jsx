import React, { useState, useEffect, useRef } from 'react';

export default function SnakeGame({ onExit }) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const canvasRef = useRef(null);
  const snakeRef = useRef([{x: 200, y: 200}]);
  const appleRef = useRef({x: 100, y: 100});
  const dirRef = useRef({dx: 20, dy: 0});
  const nextDirRef = useRef({dx: 20, dy: 0});
  const loopRef = useRef(null);
  
  useEffect(() => {
    const handleKey = (e) => {
      const { dx, dy } = dirRef.current;
      switch (e.key) {
        case 'ArrowUp': case 'w': if (dy === 0) nextDirRef.current = { dx: 0, dy: -20 }; break;
        case 'ArrowDown': case 's': if (dy === 0) nextDirRef.current = { dx: 0, dy: 20 }; break;
        case 'ArrowLeft': case 'a': if (dx === 0) nextDirRef.current = { dx: -20, dy: 0 }; break;
        case 'ArrowRight': case 'd': if (dx === 0) nextDirRef.current = { dx: 20, dy: 0 }; break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let lastTime = 0;
    const update = (time) => {
      if (time - lastTime < 100) {
        loopRef.current = requestAnimationFrame(update);
        return;
      }
      lastTime = time;
      
      dirRef.current = nextDirRef.current;
      const { dx, dy } = dirRef.current;
      const head = { x: snakeRef.current[0].x + dx, y: snakeRef.current[0].y + dy };
      
      // Wall collision
      if (head.x < 0 || head.x >= 600 || head.y < 0 || head.y >= 400) {
        setGameOver(true);
        return;
      }
      
      // Self collision
      if (snakeRef.current.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true);
        return;
      }
      
      snakeRef.current.unshift(head);
      
      // Apple collision
      if (head.x === appleRef.current.x && head.y === appleRef.current.y) {
        setScore(s => s + 10);
        appleRef.current = {
          x: Math.floor(Math.random() * 30) * 20,
          y: Math.floor(Math.random() * 20) * 20
        };
      } else {
        snakeRef.current.pop();
      }
      
      // Render
      ctx.clearRect(0, 0, 600, 400);
      
      // Draw Apple
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillRect(appleRef.current.x, appleRef.current.y, 18, 18);
      
      // Draw Snake
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 10;
      snakeRef.current.forEach((segment, i) => {
        if (i > 0) ctx.shadowBlur = 0;
        ctx.fillRect(segment.x, segment.y, 18, 18);
      });
      ctx.shadowBlur = 0;
      
      loopRef.current = requestAnimationFrame(update);
    };
    
    loopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(loopRef.current);
  }, [gameOver]);

  const restart = () => {
    snakeRef.current = [{x: 200, y: 200}];
    dirRef.current = {dx: 20, dy: 0};
    nextDirRef.current = {dx: 20, dy: 0};
    setScore(0);
    setGameOver(false);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff', position: 'relative' }}>
      <button onClick={onExit} style={{ position: 'absolute', top: 20, left: 20, padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
        &larr; Back to Arcade
      </button>

      <h1 style={{ color: '#22c55e', textShadow: '0 0 10px rgba(34, 197, 94, 0.5)', marginBottom: 10 }}>Snake Pro</h1>
      <h2 style={{ marginBottom: 30, color: '#a1a1aa' }}>Score: {score}</h2>

      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} width={600} height={400} style={{ border: '1px solid #27272a', borderRadius: 8, background: '#18181b' }}></canvas>
        {gameOver && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
            <h2 style={{ color: '#ef4444', fontSize: '32px' }}>GAME OVER</h2>
            <button onClick={restart} style={{ marginTop: 20, padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
      <p style={{ marginTop: 20, color: '#888' }}>USE ARROW KEYS OR W A S D TO MOVE</p>
    </div>
  );
}
