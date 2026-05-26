/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * Interactive Ecosystem Theme Store component.
 */

import React, { useState, useEffect } from 'react';
import { playKeyboardSound, playMouseSound, initAudioContext, playCustomSound } from '../utils/SynthAudio';

export const PRESETS = [
  {
    id: 'frosted-nebula',
    name: '✦ Frosted Nebula (Default)',
    author: 'Pro Suite Core',
    bgPrimary: '#06070a',
    bgSecondary: '#0c0d14',
    bgTertiary: '#141622',
    accentColor: 'hsl(271, 91%, 65%)',
    accentHover: 'hsl(271, 91%, 72%)',
    glassBg: 'rgba(20, 22, 34, 0.6)',
    glassBorderGlow: 'rgba(139, 92, 246, 0.25)',
    newTabWallpaper: 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 75%), #06070a',
    keyboardNoise: 'mechanical-switch',
    mouseNoise: 'water-pop',
    description: 'Frosted dark glassmorphism with deep space violet nebula glow.'
  },
  {
    id: 'cyberpunk-neon',
    name: '⚡ Cyberpunk Neon',
    author: 'RetroFuture Labs',
    bgPrimary: '#080512',
    bgSecondary: '#120722',
    bgTertiary: '#1d0c35',
    accentColor: 'hsl(322, 90%, 65%)',
    accentHover: 'hsl(322, 90%, 75%)',
    glassBg: 'rgba(16, 5, 30, 0.65)',
    glassBorderGlow: 'rgba(236, 72, 153, 0.3)',
    newTabWallpaper: 'linear-gradient(135deg, #100624 0%, #05020c 100%)',
    keyboardNoise: 'cyber-glitch',
    mouseNoise: 'laser-zap',
    description: 'Electric hot pink accents on high-contrast obsidian slate.'
  },
  {
    id: 'retro-terminal',
    name: '📟 Retro Terminal',
    author: 'Phreaker_99',
    bgPrimary: '#020502',
    bgSecondary: '#040b04',
    bgTertiary: '#081408',
    accentColor: 'hsl(120, 100%, 50%)',
    accentHover: 'hsl(120, 100%, 65%)',
    glassBg: 'rgba(2, 8, 2, 0.75)',
    glassBorderGlow: 'rgba(34, 197, 94, 0.25)',
    newTabWallpaper: 'repeating-linear-gradient(0deg, rgba(0, 20, 0, 0.1) 0px, rgba(0, 20, 0, 0.1) 2px, transparent 2px, transparent 4px), #020502',
    keyboardNoise: 'typewriter',
    mouseNoise: 'high-tech-click',
    description: 'Phosphor green CRT layout with nostalgic tactile switch sounds.'
  },
  {
    id: 'glass-aurora',
    name: '🌌 Glassmorphism Aurora',
    author: 'Nordic Designs',
    bgPrimary: '#040d12',
    bgSecondary: '#09151c',
    bgTertiary: '#12252f',
    accentColor: 'hsl(174, 90%, 60%)',
    accentHover: 'hsl(174, 90%, 70%)',
    glassBg: 'rgba(6, 20, 28, 0.6)',
    glassBorderGlow: 'rgba(20, 184, 166, 0.3)',
    newTabWallpaper: 'radial-gradient(circle at bottom right, rgba(20, 184, 166, 0.18), transparent 60%), #040d12',
    keyboardNoise: 'digital-click',
    mouseNoise: 'modern-tick',
    description: 'Icy cyan aura drifting across translucent sea-green layers.'
  }
];

export default function ThemeStore({ currentTheme, onApplyTheme }) {
  const [installedThemes, setInstalledThemes] = useState([]);
  const [communityThemes, setCommunityThemes] = useState([]);
  
  // Custom Creator Form State
  const [customName, setCustomName] = useState('My Custom Theme');
  const [customAccent, setCustomAccent] = useState('#a855f7');
  const [customBg, setCustomBg] = useState('#0a0a0f');
  const [customWallpaper, setCustomWallpaper] = useState('');
  const [uploadedWallpaper, setUploadedWallpaper] = useState('');
  const [customKeyNoise, setCustomKeyNoise] = useState('mechanical-switch');
  const [customMouseNoise, setCustomMouseNoise] = useState('water-pop');
  
  // Custom uploaded sound tracks (Base64 data URLs)
  const [uploadedKeyboardSfx, setUploadedKeyboardSfx] = useState('');
  const [uploadedMouseSfx, setUploadedMouseSfx] = useState('');
  
  // Audio test helpers
  const [testInput, setTestInput] = useState('');

  // Load custom and community themes from local storage
  useEffect(() => {
    const localInstalled = localStorage.getItem('pro_custom_themes');
    if (localInstalled) {
      setInstalledThemes(JSON.parse(localInstalled));
    }
    
    const localCommunity = localStorage.getItem('pro_community_themes');
    if (localCommunity) {
      setCommunityThemes(JSON.parse(localCommunity));
    } else {
      // Seed initial community themes
      const initialCommunity = [
        {
          id: 'comm-solarized',
          name: '🌅 Solarized Future',
          author: 'Alchemist_AI',
          bgPrimary: '#0d0d08',
          bgSecondary: '#1c1c12',
          bgTertiary: '#2c2a1e',
          accentColor: 'hsl(38, 95%, 55%)',
          accentHover: 'hsl(38, 95%, 65%)',
          glassBg: 'rgba(25, 23, 15, 0.6)',
          glassBorderGlow: 'rgba(245, 158, 11, 0.25)',
          newTabWallpaper: 'radial-gradient(circle at 100% 100%, rgba(245, 158, 11, 0.15), transparent 60%), #0d0d08',
          keyboardNoise: 'mechanical-switch',
          mouseNoise: 'water-pop',
          description: 'Cyber amber colors designed for late-night research sessions.'
        },
        {
          id: 'comm-vaporwave',
          name: '🌴 Vaporwave Sunset',
          author: 'Neon_Glitcher',
          bgPrimary: '#140c1c',
          bgSecondary: '#241434',
          bgTertiary: '#341d4c',
          accentColor: 'hsl(285, 90%, 65%)',
          accentHover: 'hsl(285, 90%, 75%)',
          glassBg: 'rgba(30, 15, 45, 0.65)',
          glassBorderGlow: 'rgba(192, 132, 252, 0.3)',
          newTabWallpaper: 'linear-gradient(0deg, #180526 0%, #0d0117 100%)',
          keyboardNoise: 'cyber-glitch',
          mouseNoise: 'laser-zap',
          description: 'A nostalgic synthwave grid layout drenched in neon magenta hues.'
        }
      ];
      localStorage.setItem('pro_community_themes', JSON.stringify(initialCommunity));
      setCommunityThemes(initialCommunity);
    }
  }, []);

  const handleKeyboardSfxUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedKeyboardSfx(event.target.result);
        playCustomSound(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseSfxUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedMouseSfx(event.target.result);
        playCustomSound(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedWallpaper(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestKeydown = (e) => {
    initAudioContext();
    if (customKeyNoise === 'custom') {
      if (uploadedKeyboardSfx) {
        playCustomSound(uploadedKeyboardSfx);
      } else {
        alert('Please upload a custom keyboard SFX file first!');
      }
    } else {
      playKeyboardSound(customKeyNoise);
    }
  };

  const handleTestMouse = () => {
    initAudioContext();
    if (customMouseNoise === 'custom') {
      if (uploadedMouseSfx) {
        playCustomSound(uploadedMouseSfx);
      } else {
        alert('Please upload a custom mouse click SFX file first!');
      }
    } else {
      playMouseSound(customMouseNoise);
    }
  };

  const createCustomThemeObj = () => {
    // Basic HSL translation
    const hex = customAccent;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    // Simple RGB to HSL approximation
    let h, s, l;
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    l = (max + min) / 2;
    if (max === min) {
      h = s = 0; 
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }
    const hslAccent = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

    return {
      id: `custom-${Date.now()}`,
      name: `✏️ ${customName}`,
      author: 'Current User',
      bgPrimary: customBg,
      bgSecondary: '#0f0f15',
      bgTertiary: '#161622',
      accentColor: hslAccent,
      accentHover: hslAccent,
      glassBg: 'rgba(15, 15, 23, 0.65)',
      glassBorderGlow: `rgba(${r}, ${g}, ${b}, 0.25)`,
      newTabWallpaper: uploadedWallpaper ? `url(${uploadedWallpaper})` : (customWallpaper || `linear-gradient(180deg, ${customBg} 0%, #050508 100%)`),
      keyboardNoise: customKeyNoise,
      mouseNoise: customMouseNoise,
      customKeyboardSfx: customKeyNoise === 'custom' ? uploadedKeyboardSfx : null,
      customMouseSfx: customMouseNoise === 'custom' ? uploadedMouseSfx : null,
      description: 'Handcrafted theme customizer layout.',
      isCustom: true
    };
  };

  const handleSaveTheme = () => {
    if (customKeyNoise === 'custom' && !uploadedKeyboardSfx) {
      alert('Please upload your custom keyboard SFX file first!');
      return;
    }
    if (customMouseNoise === 'custom' && !uploadedMouseSfx) {
      alert('Please upload your custom mouse click SFX file first!');
      return;
    }
    const newTheme = createCustomThemeObj();
    const updated = [newTheme, ...installedThemes];
    setInstalledThemes(updated);
    localStorage.setItem('pro_custom_themes', JSON.stringify(updated));
    onApplyTheme(newTheme);
    if (newTheme.mouseNoise === 'custom') {
      playCustomSound(newTheme.customMouseSfx);
    } else {
      playMouseSound(newTheme.mouseNoise);
    }
  };

  const handleUploadTheme = () => {
    if (customKeyNoise === 'custom' && !uploadedKeyboardSfx) {
      alert('Please upload your custom keyboard SFX file first!');
      return;
    }
    if (customMouseNoise === 'custom' && !uploadedMouseSfx) {
      alert('Please upload your custom mouse click SFX file first!');
      return;
    }
    const newTheme = createCustomThemeObj();
    const updatedComm = [newTheme, ...communityThemes];
    setCommunityThemes(updatedComm);
    localStorage.setItem('pro_community_themes', JSON.stringify(updatedComm));
    alert(`🚀 "${newTheme.name}" uploaded successfully to the Community Theme Store!`);
    if (newTheme.mouseNoise === 'custom') {
      playCustomSound(newTheme.customMouseSfx);
    } else {
      playMouseSound(newTheme.mouseNoise);
    }
  };

  const handleDeleteTheme = (id, e) => {
    e.stopPropagation();
    const updated = installedThemes.filter(t => t.id !== id);
    setInstalledThemes(updated);
    localStorage.setItem('pro_custom_themes', JSON.stringify(updated));
  };

  return (
    <div className="pro-theme-store-dashboard animate-slide-up">
      {/* Header Banner */}
      <div className="agent-hero glass-card" style={{ padding: '2rem' }}>
        <span className="hero-sparkle animate-pulse">🎨</span>
        <h2>pro://themes ✦ Pro Ecosystem Theme Store</h2>
        <p>Browse preinstalled cybernetic styles, create personalized dynamic themes, and toggle real-time synthesized acoustic keyboard and mouse clicks.</p>
      </div>

      <div className="theme-store-layout">
        
        {/* Left Column: Preset Selector & Community Library */}
        <div className="theme-catalog-pane">
          
          {/* Preset Layouts */}
          <div className="glass-card catalog-section-card">
            <h3>Premium Installed Layouts</h3>
            <p className="subtitle">Core cyber themes tuned with custom radial filters and lighting assets.</p>
            
            <div className="theme-grid">
              {PRESETS.map((theme) => {
                const isActive = currentTheme.id === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`theme-card glass-card ${isActive ? 'active' : ''}`}
                    onClick={() => onApplyTheme(theme)}
                    style={{ '--card-accent': theme.accentColor }}
                  >
                    <div className="theme-preview-bar" style={{ background: theme.newTabWallpaper }} />
                    <div className="theme-info">
                      <div className="theme-meta">
                        <h4>{theme.name}</h4>
                        <span className="badge-author">by {theme.author}</span>
                      </div>
                      <p>{theme.description}</p>
                      
                      <div className="theme-audio-details">
                        <span>⌨️ {theme.keyboardNoise.replace('-', ' ')}</span>
                        <span>🖱️ {theme.mouseNoise.replace('-', ' ')}</span>
                      </div>
                    </div>
                    {isActive && <div className="active-glow-dot">● ACTIVE</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Custom Installed Themes */}
          {installedThemes.length > 0 && (
            <div className="glass-card catalog-section-card" style={{ marginTop: '1.5rem' }}>
              <h3>Your Custom Themes</h3>
              <p className="subtitle">Locally compiled configurations and custom design grids.</p>
              
              <div className="theme-grid">
                {installedThemes.map((theme) => {
                  const isActive = currentTheme.id === theme.id;
                  return (
                    <div
                      key={theme.id}
                      className={`theme-card glass-card ${isActive ? 'active' : ''}`}
                      onClick={() => onApplyTheme(theme)}
                      style={{ '--card-accent': theme.accentColor }}
                    >
                      <div className="theme-preview-bar" style={{ background: theme.newTabWallpaper }} />
                      <div className="theme-info">
                        <div className="theme-meta">
                          <h4>{theme.name}</h4>
                          <button className="delete-theme-btn" onClick={(e) => handleDeleteTheme(theme.id, e)}>Delete ×</button>
                        </div>
                        <p>{theme.description}</p>
                        
                        <div className="theme-audio-details">
                          <span>⌨️ {theme.keyboardNoise.replace('-', ' ')}</span>
                          <span>🖱️ {theme.mouseNoise.replace('-', ' ')}</span>
                        </div>
                      </div>
                      {isActive && <div className="active-glow-dot">● ACTIVE</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Community Library Section */}
          <div className="glass-card catalog-section-card" style={{ marginTop: '1.5rem' }}>
            <h3>Community Themes & Uploads</h3>
            <p className="subtitle">Install themes handcrafted by other ecosystem contributors worldwide.</p>
            
            <div className="theme-grid">
              {communityThemes.map((theme) => {
                const isActive = currentTheme.id === theme.id;
                return (
                  <div
                    key={theme.id}
                    className={`theme-card glass-card ${isActive ? 'active' : ''}`}
                    onClick={() => onApplyTheme(theme)}
                    style={{ '--card-accent': theme.accentColor }}
                  >
                    <div className="theme-preview-bar" style={{ background: theme.newTabWallpaper }} />
                    <div className="theme-info">
                      <div className="theme-meta">
                        <h4>{theme.name}</h4>
                        <span className="badge-author">Uploaded by {theme.author}</span>
                      </div>
                      <p>{theme.description}</p>
                      
                      <div className="theme-audio-details">
                        <span>⌨️ {theme.keyboardNoise.replace('-', ' ')}</span>
                        <span>🖱️ {theme.mouseNoise.replace('-', ' ')}</span>
                      </div>
                    </div>
                    {isActive && <div className="active-glow-dot">● ACTIVE</div>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Theme Creator Panel */}
        <div className="theme-creator-pane">
          <div className="glass-card agent-form-card creator-sticky-card">
            <h3>🎨 Dynamic Theme Creator</h3>
            <p className="subtitle">Design, test, and instantly apply custom visual variables.</p>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Theme Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Accent Color</label>
                <div className="color-input-container">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="color-picker-input"
                  />
                  <span className="color-hex">{customAccent}</span>
                </div>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Canvas Background</label>
                <div className="color-input-container">
                  <input
                    type="color"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="color-picker-input"
                  />
                  <span className="color-hex">{customBg}</span>
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>New Tab Wallpaper (CSS / Image URL)</label>
              <input
                type="text"
                value={customWallpaper}
                onChange={(e) => setCustomWallpaper(e.target.value)}
                placeholder="e.g. url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809)"
                className="input-field"
                disabled={uploadedWallpaper !== ''}
              />
              <span className="field-tip">Leave blank to use default solid color with dynamic glow filters.</span>
              
              <div className="wallpaper-upload-wrapper" style={{ marginTop: '0.75rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWallpaperUpload}
                  className="file-upload-input"
                  id="wallpaper-file-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="wallpaper-file-input" className="btn btn-secondary btn-sm" style={{ width: '100%', border: '1px dashed var(--accent-color)' }}>
                  {uploadedWallpaper ? '✓ Animated/Image Background Configured' : '📤 Upload Animated Background (.gif, .webp, or image)'}
                </label>
                {uploadedWallpaper && (
                  <button 
                    className="btn btn-sm" 
                    onClick={() => setUploadedWallpaper('')} 
                    style={{ marginTop: '0.4rem', width: '100%', fontSize: '0.75rem', padding: '0.2rem', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Clear Uploaded Background ×
                  </button>
                )}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.2rem' }}>
              <label>Synthesized Keyboard Sound</label>
              <select
                value={customKeyNoise}
                onChange={(e) => setCustomKeyNoise(e.target.value)}
                className="input-field select-field"
              >
                <option value="mechanical-switch">⌨️ Mechanical switch (Click-clack)</option>
                <option value="typewriter">📟 Retro Typewriter (Wood snap)</option>
                <option value="cyber-glitch">⚡ Synth Glitch (Chirp slide)</option>
                <option value="digital-click">🖱️ Digital Click (Ultra brief)</option>
                <option value="custom">💾 Upload Custom SFX File...</option>
              </select>
              {customKeyNoise === 'custom' && (
                <div className="sfx-upload-container" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleKeyboardSfxUpload}
                    className="file-upload-input"
                    id="keyboard-sfx-file"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="keyboard-sfx-file" className="btn btn-secondary btn-sm" style={{ width: '100%', border: '1px dashed var(--accent-color)' }}>
                    {uploadedKeyboardSfx ? '✓ Keyboard SFX Configured' : '📤 Choose Keyboard Audio File'}
                  </label>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Synthesized Mouse Sound</label>
              <select
                value={customMouseNoise}
                onChange={(e) => setCustomMouseNoise(e.target.value)}
                className="input-field select-field"
              >
                <option value="water-pop">💧 Liquid Water Pop</option>
                <option value="laser-zap">🔫 High Tech Laser Zap</option>
                <option value="high-tech-click">🔩 Metallic Click Snap</option>
                <option value="modern-tick">⚪ Dampened Modern Tick</option>
                <option value="custom">💾 Upload Custom SFX File...</option>
              </select>
              {customMouseNoise === 'custom' && (
                <div className="sfx-upload-container" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleMouseSfxUpload}
                    className="file-upload-input"
                    id="mouse-sfx-file"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="mouse-sfx-file" className="btn btn-secondary btn-sm" style={{ width: '100%', border: '1px dashed var(--accent-color)' }}>
                    {uploadedMouseSfx ? '✓ Mouse SFX Configured' : '📤 Choose Mouse Audio File'}
                  </label>
                </div>
              )}
            </div>

            {/* Live Audio Test Area */}
            <div className="audio-test-pad glass-card" style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.15)' }}>
              <h4>🔊 Acoustic Playground</h4>
              <p className="subtitle">Test your chosen sound profiles before saving!</p>
              
              <div className="test-controls">
                <button className="btn btn-secondary btn-sm" onClick={handleTestMouse} style={{ width: '100%' }}>
                  Test Mouse Sound 🖱️
                </button>
                
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={handleTestKeydown}
                  placeholder="Type here to test keyboard noise..."
                  className="input-field btn-sm"
                  style={{ marginTop: '0.75rem', height: '34px', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            {/* Custom Creator Action Buttons */}
            <div className="action-row" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={handleSaveTheme} style={{ flex: 1, padding: '0.6rem 0.5rem' }}>
                Save & Apply 🎨
              </button>
              <button className="btn btn-secondary" onClick={handleUploadTheme} style={{ flex: 1, padding: '0.6rem 0.5rem', border: '1px solid var(--accent-color)', color: '#ffffff' }}>
                Upload Theme 🚀
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Styled Embed Code */}
      <style>{`
        .pro-theme-store-dashboard {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 1.5rem;
          overflow-y: auto;
          height: 100%;
        }
        .theme-store-layout {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 1.5rem;
        }
        .theme-catalog-pane {
          display: flex;
          flex-direction: column;
        }
        .catalog-section-card {
          padding: 1.5rem;
        }
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
          margin-top: 1rem;
        }
        .theme-card {
          position: relative;
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition-speed);
          border: 1px solid var(--glass-border);
          padding: 0;
        }
        .theme-card:hover {
          transform: translateY(-3px);
          border-color: var(--card-accent, var(--accent-color));
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .theme-card.active {
          border-color: var(--card-accent, var(--accent-color));
          box-shadow: 0 0 12px var(--glass-border-glow);
        }
        .theme-preview-bar {
          height: 48px;
          width: 100%;
          border-bottom: 1px solid var(--glass-border);
        }
        .theme-info {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .theme-meta {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .theme-meta h4 {
          font-size: 0.95rem;
          font-weight: 600;
        }
        .badge-author {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .theme-info p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.4;
          height: 2.8rem;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .theme-audio-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--text-muted);
          border-top: 1px solid rgba(255,255,255,0.03);
          padding-top: 0.5rem;
          margin-top: 0.25rem;
        }
        .active-glow-dot {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: var(--card-accent, var(--accent-color));
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          letter-spacing: 0.5px;
          box-shadow: 0 0 8px var(--card-accent);
        }
        .theme-creator-pane {
          display: flex;
          flex-direction: column;
        }
        .creator-sticky-card {
          position: sticky;
          top: 0.5rem;
        }
        .color-input-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .color-picker-input {
          -webkit-appearance: none;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          background: none;
          padding: 0;
        }
        .color-picker-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }
        .color-picker-input::-webkit-color-swatch {
          border: 1px solid var(--glass-border);
          border-radius: 6px;
        }
        .color-hex {
          font-family: var(--mono-font);
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .audio-test-pad {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--glass-border);
        }
        .audio-test-pad h4 {
          font-size: 0.85rem;
          font-weight: 600;
        }
        .test-controls {
          display: flex;
          flex-direction: column;
          margin-top: 0.75rem;
        }
        .delete-theme-btn {
          background: none;
          border: none;
          color: var(--danger-color);
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0;
        }
        .delete-theme-btn:hover {
          text-decoration: underline;
        }
        .field-tip {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
          display: block;
        }
      `}</style>
    </div>
  );
}
