import React, { useState, useEffect } from 'react';
import { PRESETS } from './ThemeStore';

export default function WelcomePortal({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('zen-dark');
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);

  // Apply theme dynamically as user selects it during onboarding
  useEffect(() => {
    const theme = PRESETS.find(p => p.id === selectedTheme) || PRESETS[0];
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.bgPrimary);
    root.style.setProperty('--bg-secondary', theme.bgSecondary);
    root.style.setProperty('--bg-tertiary', theme.bgTertiary);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--accent-glow', theme.accentGlow);
    root.style.setProperty('--glass-border', theme.glassBorder);
    root.style.setProperty('--glass-border-glow', theme.glassBorderGlow);
    
    if (theme.textPrimary) {
      root.style.setProperty('--text-primary', theme.textPrimary);
      root.style.setProperty('--text-secondary', theme.textSecondary);
      root.style.setProperty('--text-muted', theme.textMuted);
    }
  }, [selectedTheme]);

  const handleFinish = () => {
    // Save theme to localStorage to persist it when they exit welcome
    localStorage.setItem('pro-browser-theme', selectedTheme);
    window.dispatchEvent(new Event('theme-changed'));
    onNavigate('pro://home');
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      setImportDone(true);
      setTimeout(() => setStep(4), 1000);
    }, 2000);
  };

  return (
    <div className="onboarding-wizard animate-slide-up">
      <div className="wizard-container glass-card">
        
        {/* Progress Bar */}
        <div className="wizard-progress">
          <div className="progress-bar-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <div className="step-content text-center animate-slide-up">
              <div className="sparkle-icon">☁️</div>
              <h1>Welcome to a Calmer Internet</h1>
              <p className="subtitle">Set up your Zen Browser experience in just a few clicks.</p>
              
              <div className="hero-graphic">
                <div className="mini-browser-mockup">
                  <div className="mockup-sidebar"></div>
                  <div className="mockup-content">
                    <div className="mockup-header"></div>
                    <div className="mockup-body"></div>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg mt-4" onClick={() => setStep(2)}>
                Get Started ✦
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-content animate-slide-up">
              <h2 className="text-center">Choose Your Aesthetic</h2>
              <p className="text-center subtitle">Select a theme that brings you peace.</p>
              
              <div className="theme-grid">
                {PRESETS.map(theme => (
                  <div 
                    key={theme.id}
                    className={`theme-option ${selectedTheme === theme.id ? 'selected' : ''}`}
                    style={{ background: theme.bgSecondary, borderColor: selectedTheme === theme.id ? theme.accentColor : theme.glassBorder }}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <div className="theme-preview" style={{ background: theme.bgPrimary }}>
                      <div className="theme-swatch" style={{ background: theme.accentColor }}></div>
                    </div>
                    <strong>{theme.name}</strong>
                  </div>
                ))}
              </div>

              <div className="wizard-actions">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>Continue ➔</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content text-center animate-slide-up">
              <h2>Bring Your Data</h2>
              <p className="subtitle">Import your bookmarks, history, and passwords from your old browser.</p>
              
              <div className="import-card">
                <div className="browser-icons">
                  <span className="b-icon">🔴</span>
                  <span className="b-icon">🦊</span>
                  <span className="b-icon">🧭</span>
                </div>
                
                {!importing && !importDone && (
                  <button className="btn btn-secondary btn-lg import-btn" onClick={handleImport}>
                    Import from Another Browser
                  </button>
                )}
                
                {importing && (
                  <div className="import-loading">
                    <div className="spinner"></div>
                    <p>Securely transferring data...</p>
                  </div>
                )}
                
                {importDone && (
                  <div className="import-success text-success">
                    <span className="check-icon">✓</span>
                    <p>Import Complete!</p>
                  </div>
                )}
              </div>

              <div className="wizard-actions">
                <button className="btn btn-secondary" onClick={() => setStep(2)} disabled={importing}>Back</button>
                <button className="btn btn-primary" onClick={() => setStep(4)} disabled={importing}>Skip / Continue ➔</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="step-content text-center animate-slide-up">
              <div className="sparkle-icon">✨</div>
              <h1>You're All Set!</h1>
              <p className="subtitle">Your Zen experience is ready. Enjoy the calm.</p>
              
              <div className="final-check-list">
                <div className="check-item"><span className="text-success">✓</span> Aesthetic applied</div>
                <div className="check-item"><span className="text-success">✓</span> Data synchronized</div>
                <div className="check-item"><span className="text-success">✓</span> Trackers blocked</div>
              </div>

              <button className="btn btn-primary btn-lg mt-4" onClick={handleFinish}>
                Start Browsing 🚀
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .onboarding-wizard {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 8rem);
          padding: 2rem;
        }

        .wizard-container {
          width: 100%;
          max-width: 700px;
          min-height: 500px;
          background: rgba(15, 12, 30, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .wizard-progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          width: 100%;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--accent-color);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px var(--accent-glow);
        }

        .wizard-content {
          flex: 1;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .step-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: slideUp 0.4s ease-out forwards;
        }

        .text-center { text-align: center; }
        .mt-4 { margin-top: 2rem; }
        .subtitle { color: var(--text-secondary); font-size: 1.1rem; }

        .sparkle-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: pulse 3s infinite ease-in-out;
        }

        /* Hero Graphic */
        .hero-graphic {
          display: flex;
          justify-content: center;
          margin: 2rem 0;
        }
        .mini-browser-mockup {
          width: 350px;
          height: 220px;
          background: var(--bg-primary);
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          display: flex;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .mockup-sidebar {
          width: 60px;
          background: var(--bg-secondary);
          border-right: 1px solid var(--glass-border);
        }
        .mockup-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .mockup-header {
          height: 40px;
          border-bottom: 1px solid var(--glass-border);
        }
        .mockup-body {
          flex: 1;
          background: rgba(255,255,255,0.02);
          margin: 10px;
          border-radius: 8px;
        }

        /* Theme Grid */
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem;
          margin: 1rem 0;
        }

        .theme-option {
          border: 2px solid transparent;
          border-radius: 16px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .theme-option:hover {
          transform: translateY(-2px);
          border-color: var(--glass-border-glow);
        }
        
        .theme-option.selected {
          box-shadow: 0 0 20px var(--accent-glow);
          transform: scale(1.02);
        }

        .theme-preview {
          width: 100%;
          height: 80px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .theme-swatch {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        /* Import Card */
        .import-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          margin: 1rem 0;
        }
        .browser-icons {
          display: flex;
          gap: 1rem;
          font-size: 2.5rem;
          opacity: 0.8;
        }
        .import-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: var(--accent-color);
        }
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(139, 92, 246, 0.2);
          border-top-color: var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .check-icon {
          font-size: 3rem;
          display: block;
          margin-bottom: 0.5rem;
        }

        /* Final Checklist */
        .final-check-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          margin: 1.5rem 0;
        }
        .check-item {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.03);
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          width: 100%;
          max-width: 300px;
        }

        .wizard-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--glass-border);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
