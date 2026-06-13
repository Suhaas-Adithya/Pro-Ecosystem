import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [playlist, setPlaylist] = useState([
    { id: 1, name: 'Cyberpunk City.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 2, name: 'Vaporwave Nights.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' }
  ]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    const nextIdx = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIdx);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    const prevIdx = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIdx);
    setIsPlaying(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('asset', file);

    try {
      const res = await fetch('http://localhost:3001/api/themes/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.url) {
        setPlaylist(prev => [...prev, { id: Date.now(), name: file.name, url: data.url }]);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="audio-container">
      <div className="vinyl-record">
        <div className={`record ${isPlaying ? 'spinning' : ''}`}>
          <div className="record-label">PRO<br/>AUDIO</div>
        </div>
      </div>

      <div className="player-controls">
        <div className="track-info">
          <h2>{playlist[currentTrackIndex]?.name || 'No Tracks'}</h2>
          <div className="spectrum-bars">
            <span className={`bar ${isPlaying ? 'anim' : ''}`}></span>
            <span className={`bar ${isPlaying ? 'anim' : ''}`} style={{animationDelay: '0.1s'}}></span>
            <span className={`bar ${isPlaying ? 'anim' : ''}`} style={{animationDelay: '0.2s'}}></span>
            <span className={`bar ${isPlaying ? 'anim' : ''}`} style={{animationDelay: '0.3s'}}></span>
          </div>
        </div>

        <audio 
          ref={audioRef} 
          src={playlist[currentTrackIndex]?.url} 
          onEnded={nextTrack}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          autoPlay={isPlaying}
        />

        <div className="control-buttons">
          <button className="ctrl-btn" onClick={prevTrack}>⏮</button>
          <button className="ctrl-btn play-btn" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="ctrl-btn" onClick={nextTrack}>⏭</button>
        </div>
      </div>

      <div className="playlist-panel">
        <div className="playlist-header">
          <h3>Local Vault Playlist</h3>
          <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
            {isUploading ? 'Uploading...' : '+ Upload MP3'}
          </button>
          <input 
            type="file" 
            accept="audio/mp3, audio/wav" 
            ref={fileInputRef}
            style={{display: 'none'}} 
            onChange={handleFileUpload}
          />
        </div>
        
        <div className="playlist-tracks">
          {playlist.map((track, idx) => (
            <div 
              key={track.id} 
              className={`track-item ${idx === currentTrackIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentTrackIndex(idx);
                setIsPlaying(true);
              }}
            >
              <span className="track-icon">{idx === currentTrackIndex && isPlaying ? '🎵' : '📄'}</span>
              <span className="track-name">{track.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
