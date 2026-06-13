import React, { useState } from 'react';

export default function GamePlayer({ game, onExit }) {
  const [loading, setLoading] = useState(true);

  if (!game) return null;

  return (
    <div className="game-player-overlay" style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: '#000', zIndex: 100, display: 'flex', flexDirection: 'column'
    }}>
      <div className="game-player-header" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', background: '#09090b', borderBottom: '1px solid #27272a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onExit} style={{
            background: 'transparent', border: 'none', color: '#fff', 
            fontSize: '14px', cursor: 'pointer', padding: '8px 12px',
            borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>&larr;</span> Back to Arcade
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>{game.title}</h2>
          <span style={{ background: '#3b82f6', color: '#fff', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' }}>
            {game.genre}
          </span>
        </div>
        
        <a 
          href={game.game_url} 
          target="_blank" 
          rel="noreferrer"
          style={{
            color: '#a1a1aa', textDecoration: 'none', fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px'
          }}
        >
          Launch in Browser <span>&#8599;</span>
        </a>
      </div>

      <div className="game-player-content" style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexDirection: 'column', gap: '16px'
          }}>
            <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p>Loading {game.title}...</p>
            <p style={{ color: '#a1a1aa', fontSize: '12px' }}>If the game doesn't load, use "Launch in Browser" above.</p>
          </div>
        )}
        <iframe
          src={game.game_url}
          title={game.title}
          onLoad={() => setLoading(false)}
          style={{ width: '100%', height: '100%', border: 'none', display: loading ? 'none' : 'block' }}
          allow="autoplay; fullscreen; gamepad; focus"
        ></iframe>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
