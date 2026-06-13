import { useState, useEffect } from 'react';
import './App.css';
import GamePlayer from './components/GamePlayer';
import NeonProtocol from './components/NeonProtocol';
import SnakeGame from './components/SnakeGame';

function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeGame, setActiveGame] = useState(null); // URL or 'neon-protocol' or 'snake-pro'
  const [categories, setCategories] = useState({});

  useEffect(() => {
    fetch('http://localhost:3001/api/games/freetogame')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid API response');
        
        // Filter out games that don't have play_url or game_url if needed, but freetogame usually returns game_url
        setGames(data);
        
        // Group by genre
        const cats = {};
        data.forEach(game => {
          if (!cats[game.genre]) cats[game.genre] = [];
          cats[game.genre].push(game);
        });
        setCategories(cats);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load online games", err);
        setError("Could not load online games. You can still play Offline Games.");
        setLoading(false);
      });
  }, []);

  const launchNative = (gameId) => {
    setActiveGame({ native: gameId });
  };

  const launchWeb = (game) => {
    setActiveGame({ web: game });
  };

  if (activeGame) {
    if (activeGame.native === 'neon-protocol') {
      return <NeonProtocol onExit={() => setActiveGame(null)} />;
    }
    if (activeGame.native === 'snake-pro') {
      return <SnakeGame onExit={() => setActiveGame(null)} />;
    }
    if (activeGame.native === 'neon-offline') {
      return <NeonProtocol onExit={() => setActiveGame(null)} isOffline={true} />;
    }
    if (activeGame.web) {
      return <GamePlayer game={activeGame.web} onExit={() => setActiveGame(null)} />;
    }
  }

  return (
    <div className="arcade-hub">
      <header className="arcade-header-nav">
        <h1>🎮 Pro Arcade</h1>
        <div className="nav-links">
          <span>Home</span>
          <span>Multiplayer</span>
          <span>Offline</span>
        </div>
      </header>

      <div className="hub-content">
        {/* HERO SECTION */}
        <div className="hero-banner">
          <div className="hero-content">
            <h2>Neon Protocol</h2>
            <p>Experience the flagship multiplayer arcade experience of Pro Suite. Challenge your friends globally or train against the AI.</p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => launchNative('neon-protocol')}>Play Multiplayer</button>
              <button className="btn-secondary" onClick={() => launchNative('neon-offline')}>Play vs AI</button>
            </div>
          </div>
        </div>

        {/* NATIVE / OFFLINE GAMES */}
        <div className="category-row">
          <h3 className="category-title">Installed / Offline Games</h3>
          <div className="games-scroller">
            <div className="game-card native-card" onClick={() => launchNative('neon-offline')}>
              <div className="game-thumb" style={{ background: 'linear-gradient(45deg, #4c1d95, #7c3aed)' }}>
                <span style={{ fontSize: '48px' }}>🏓</span>
              </div>
              <h4>Neon Protocol (Offline)</h4>
              <p className="game-genre">Sports / Arcade</p>
            </div>
            <div className="game-card native-card" onClick={() => launchNative('snake-pro')}>
              <div className="game-thumb" style={{ background: 'linear-gradient(45deg, #14532d, #16a34a)' }}>
                <span style={{ fontSize: '48px' }}>🐍</span>
              </div>
              <h4>Snake Pro</h4>
              <p className="game-genre">Classic</p>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '20px', background: '#3f3f46', margin: '20px 40px', borderRadius: '8px' }}>
            <span style={{ color: '#ef4444' }}>⚠️</span> {error}
          </div>
        )}

        {loading && !error && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
            <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <p style={{ marginTop: '16px' }}>Loading thousands of online games...</p>
          </div>
        )}

        {/* BROWSER GAMES FROM FREETOGAME */}
        {Object.keys(categories).slice(0, 10).map(genre => (
          <div className="category-row" key={genre}>
            <h3 className="category-title">{genre} Games</h3>
            <div className="games-scroller">
              {categories[genre].map(game => (
                <div className="game-card" key={game.id} onClick={() => launchWeb(game)}>
                  <div className="game-thumb-wrapper">
                    <img src={game.thumbnail} alt={game.title} loading="lazy" />
                  </div>
                  <h4>{game.title}</h4>
                  <p className="game-genre">{game.publisher}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
