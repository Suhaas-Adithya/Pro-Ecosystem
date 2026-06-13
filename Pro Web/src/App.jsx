import React, { useState } from 'react';
import './App.css';

function App() {
  const [urlInput, setUrlInput] = useState('https://en.wikipedia.org/wiki/Web_browser');
  const [activeUrl, setActiveUrl] = useState('https://en.wikipedia.org/wiki/Web_browser');
  const [isLoading, setIsLoading] = useState(false);

  const handleNavigate = (e) => {
    e.preventDefault();
    let targetUrl = urlInput;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    setIsLoading(true);
    setActiveUrl(targetUrl);
    setUrlInput(targetUrl);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="pro-web-container">
      {/* ─── URL BAR HEADER ─── */}
      <div className="browser-header">
        <div className="nav-controls">
          <button className="nav-btn">◀</button>
          <button className="nav-btn">▶</button>
          <button className="nav-btn" onClick={() => { setActiveUrl('https://en.wikipedia.org/wiki/Web_browser'); setUrlInput('https://en.wikipedia.org/wiki/Web_browser'); }}>🏠</button>
        </div>
        
        <form onSubmit={handleNavigate} className="url-form">
          <div className="url-input-wrapper">
            <span className="secure-lock">🔒</span>
            <input 
              type="text" 
              className="url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search or enter web address"
            />
            {isLoading && <span className="loading-spinner">✦</span>}
          </div>
        </form>

        <div className="extension-controls">
          <button className="ext-btn">⭐</button>
          <button className="ext-btn">🧩</button>
        </div>
      </div>

      {/* ─── WEB VIEWPORT ─── */}
      <div className="browser-viewport">
        <iframe 
          src={activeUrl}
          title="Pro Web Viewport"
          className="web-iframe"
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}

export default App;
