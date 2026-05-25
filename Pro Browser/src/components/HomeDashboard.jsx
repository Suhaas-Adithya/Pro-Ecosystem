/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * Cybermatic Onboarding Home Dashboard.
 */

import React, { useState, useEffect } from 'react';
import { initAudioContext, playMouseSound } from '../utils/SynthAudio';

export default function HomeDashboard({ userProfile, onNavigate, currentTheme }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [cpuLoad, setCpuLoad] = useState(12);
  const [telemetryState, setTelemetryState] = useState('SYNCHRONIZED');
  const [systemUptime, setSystemUptime] = useState(0);

  // Live futuristic clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString());
      setDateStr(d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry fluctuation simulator
  useEffect(() => {
    const cpuInterval = setInterval(() => {
      setCpuLoad(Math.floor(Math.random() * 25 + 8));
    }, 3000);

    const uptimeInterval = setInterval(() => {
      setSystemUptime(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(cpuInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const handleTileClick = (url) => {
    initAudioContext();
    playMouseSound(currentTheme.mouseNoise);
    onNavigate(url);
  };

  const formatUptime = (sec) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pro-home-dashboard animate-slide-up">
      
      {/* Top Welcome Panel Grid */}
      <div className="dashboard-grid-row top-row">
        
        {/* Core Profile Greeting */}
        <div className="glass-card welcome-card">
          <div className="profile-banner">
            <span className="profile-avatar">{userProfile.avatar || '🤖'}</span>
            <div className="profile-details">
              <span className="welcome-tag">ECOSYSTEM CLIENT ENGAGED</span>
              <h2>Greetings, Agent {userProfile.username || 'User'}</h2>
              <span className="profile-email">{userProfile.email || 'agent@pro.eco'}</span>
            </div>
          </div>
          <p className="onboarding-welcome-note">
            Your Pro Suite workspace is fully synchronized. study modular databases, execute secure P2P meeting sessions, and program autonomous AI browsing agents from your secure unified gateway.
          </p>
          <div className="profile-badge-row">
            <span className="badge-theme">🎨 Theme: {currentTheme.name}</span>
            <span className="badge-status">● Local Mesh Tethered</span>
          </div>
        </div>

        {/* Holographic Space Clock */}
        <div className="glass-card clock-card">
          <span className="telemetry-spark">⏰ DYNCLOCK FEED</span>
          <div className="clock-time-shadow">{timeStr}</div>
          <div className="clock-date-line">{dateStr}</div>
          <div className="uptime-tracker">
            <span>GATEWAY SECURE UPTIME:</span>
            <span className="uptime-counter">{formatUptime(systemUptime)}</span>
          </div>
        </div>

      </div>

      {/* App Launcher Suite Matrix */}
      <div className="dashboard-section">
        <h3>🚀 Tethered Multi-Workspace Matrix</h3>
        <p className="subtitle">Instant localized routing to secure workspace portals and compiler grids.</p>
        
        <div className="launcher-grid">
          
          {/* Pro Dev */}
          <div className="launcher-tile glass-card" onClick={() => handleTileClick('pro://engine')}>
            <span className="tile-icon">🛠️</span>
            <h4>Pro Dev ADE</h4>
            <p>Study, audit, and commit open-source ecosystem codes.</p>
            <span className="tile-action">Launch Workspace →</span>
          </div>

          {/* Pro Docs */}
          <div className="launcher-tile glass-card" onClick={() => handleTileClick('pro://docs')}>
            <span className="tile-icon">📝</span>
            <h4>Pro Docs</h4>
            <p>Write rich markdown documents and AI co-writer logs.</p>
            <span className="tile-action">Launch Editor →</span>
          </div>

          {/* Pro Sheets */}
          <div className="launcher-tile glass-card" onClick={() => handleTileClick('pro://sheets')}>
            <span className="tile-icon">📊</span>
            <h4>Pro Sheets</h4>
            <p>Compile math cells and paint neon vector charts.</p>
            <span className="tile-action">Open Grid →</span>
          </div>

          {/* Pro Slides */}
          <div className="launcher-tile glass-card" onClick={() => handleTileClick('pro://slides')}>
            <span className="tile-icon">📽️</span>
            <h4>Pro Slides</h4>
            <p>Compose absolute visual vector shape slide presentations.</p>
            <span className="tile-action">Open Slide Deck →</span>
          </div>

          {/* Gemma Autopilot */}
          <div className="launcher-tile glass-card agent-tile" onClick={() => handleTileClick('pro://agent')}>
            <span className="tile-icon">🤖</span>
            <h4>Gemma Autopilot</h4>
            <p>Engage the multi-tab autonomous background agent loop.</p>
            <span className="tile-action">Engage Autopilot →</span>
          </div>

          {/* Extension Store */}
          <div className="launcher-tile glass-card" onClick={() => handleTileClick('pro://store')}>
            <span className="tile-icon">🔌</span>
            <h4>Extension Store</h4>
            <p>Compile and inject dynamic browser lifecycle hooks.</p>
            <span className="tile-action">Open Store →</span>
          </div>

          {/* Theme Store */}
          <div className="launcher-tile glass-card theme-store-tile" onClick={() => handleTileClick('pro://themes')}>
            <span className="tile-icon">🎨</span>
            <h4>Theme Store</h4>
            <p>Customize backgrounds, wallpapers, and synthesized click noises.</p>
            <span className="tile-action">Open Theme Hub →</span>
          </div>

        </div>
      </div>

      {/* Diagnostics and Telemetry Panels */}
      <div className="dashboard-grid-row bottom-row">
        
        {/* System Diagnostics */}
        <div className="glass-card telemetry-card">
          <h4>🛰️ Ecosystem Telemetry Monitors</h4>
          <div className="telemetry-bar-row">
            <div className="tel-stat">
              <span>CPU Core Load</span>
              <strong>{cpuLoad}%</strong>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${cpuLoad}%`, background: 'var(--accent-color)', boxShadow: '0 0 8px var(--accent-glow)' }} />
            </div>
          </div>
          <div className="telemetry-bar-row">
            <div className="tel-stat">
              <span>Local Socket Mesh (Port 3001)</span>
              <strong style={{ color: 'var(--success-color)' }}>{telemetryState}</strong>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '100%', background: 'var(--success-color)' }} />
            </div>
          </div>
        </div>

        {/* Quick Missions Helper */}
        <div className="glass-card quick-missions-card">
          <h4>💡 Recommended Agent Missions</h4>
          <p className="subtitle">Suggested coordinates to launch autonomous background autopilot sweeps:</p>
          <div className="quick-goals-grid" style={{ marginTop: '0.75rem' }}>
            <button className="quick-goal-chip" onClick={() => handleTileClick('pro://agent')}>
              📚 Quantum Computing Wikipedia Scrape Summaries
            </button>
            <button className="quick-goal-chip" onClick={() => handleTileClick('pro://agent')}>
              🧪 Superconductivity Research Compilation
            </button>
          </div>
        </div>

      </div>

      {/* Embed Styles */}
      <style>{`
        .pro-home-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          overflow-y: auto;
          height: 100%;
        }
        .dashboard-grid-row {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 1.5rem;
        }
        .welcome-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .profile-banner {
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .profile-avatar {
          font-size: 3rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .profile-details {
          display: flex;
          flex-direction: column;
        }
        .welcome-tag {
          font-size: 0.68rem;
          color: var(--accent-color);
          font-weight: 800;
          letter-spacing: 1px;
        }
        .profile-details h2 {
          font-size: 1.4rem;
          margin: 0.1rem 0;
          color: #ffffff;
        }
        .profile-email {
          font-family: var(--mono-font);
          font-size: 0.76rem;
          color: var(--text-muted);
        }
        .onboarding-welcome-note {
          font-size: 0.88rem;
          color: var(--text-secondary);
          margin-top: 1rem;
          line-height: 1.5;
        }
        .profile-badge-row {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .badge-theme, .badge-status {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .badge-status {
          color: var(--success-color);
        }
        .clock-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        }
        .telemetry-spark {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .clock-time-shadow {
          font-family: var(--heading-font);
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          text-shadow: 0 0 20px var(--accent-glow);
        }
        .clock-date-line {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
          font-weight: 500;
        }
        .uptime-tracker {
          border-top: 1px solid var(--glass-border);
          width: 100%;
          padding-top: 0.75rem;
          margin-top: 1.25rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .uptime-counter {
          font-family: var(--mono-font);
          color: #ffffff;
          font-weight: 600;
        }
        .dashboard-section {
          display: flex;
          flex-direction: column;
        }
        .launcher-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.25rem;
          margin-top: 1rem;
        }
        .launcher-tile {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          cursor: pointer;
          transition: all var(--transition-speed);
          border: 1px solid var(--glass-border);
        }
        .launcher-tile:hover {
          transform: translateY(-3px);
          border-color: var(--accent-color);
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .tile-icon {
          font-size: 2rem;
        }
        .launcher-tile h4 {
          font-size: 1rem;
          font-weight: 600;
        }
        .launcher-tile p {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
          height: 2.2rem;
          overflow: hidden;
        }
        .tile-action {
          font-size: 0.72rem;
          color: var(--accent-color);
          font-weight: 700;
          margin-top: 0.5rem;
        }
        .agent-tile {
          border-color: rgba(139, 92, 246, 0.25);
        }
        .theme-store-tile {
          border-color: rgba(236, 72, 153, 0.25);
        }
        .telemetry-card, .quick-missions-card {
          padding: 1.5rem;
        }
        .telemetry-bar-row {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 1rem;
        }
        .tel-stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--text-secondary);
        }
        .progress-bar-bg {
          height: 6px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--glass-border);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
