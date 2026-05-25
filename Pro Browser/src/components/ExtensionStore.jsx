import React, { useState } from 'react';

export default function ExtensionStore({ activeExtensions, onToggleExtension, onRegisterCustomExtension }) {
  const [activeTab, setActiveTab] = useState('browse');
  const [installingId, setInstallingId] = useState(null);

  // Form states for creating custom extensions
  const [extName, setExtName] = useState('');
  const [extDesc, setExtDesc] = useState('');
  const [extHook, setExtHook] = useState('onPaint');
  const [extCode, setExtCode] = useState(`// custom plugin code\n(ctx) => {\n  // Draw a glowing neon circle in top-left\n  ctx.strokeStyle = 'hsl(271, 81%, 56%)';\n  ctx.lineWidth = 3;\n  ctx.shadowColor = 'hsla(271, 81%, 56%, 0.5)';\n  ctx.shadowBlur = 10;\n  ctx.beginPath();\n  ctx.arc(50, 50, 20, 0, Math.PI * 2);\n  ctx.stroke();\n  ctx.shadowBlur = 0; // reset\n}`);

  const extensionCatalog = [
    {
      id: 'gemma-autopilot',
      name: 'Gemma 4 Autopilot Agent 🤖',
      version: '1.5.0',
      description: 'Supercharges your browser into a completely autonomous agentic web runner. Instantly translates user goals, clicks vector coordinates, auto-fills query inputs, and navigates structural HTML pages recursively.',
      hook: 'onPaint',
      author: 'Gemma Core Dev Team'
    }
  ];

  const handleInstall = (id) => {
    setInstallingId(id);
    setTimeout(() => {
      onToggleExtension(id);
      setInstallingId(null);
    }, 1500); // Simulate network pipeline routing
  };

  const handleCreateExtension = (e) => {
    e.preventDefault();
    if (!extName.trim() || !extDesc.trim()) return;

    try {
      // Evaluate custom script securely into dynamic executable hook
      const evaluatedHook = new Function(`return ${extCode.trim()}`)();
      
      const customExt = {
        id: `custom-${Date.now()}`,
        name: `${extName.trim()} ✦`,
        version: '1.0.0',
        description: extDesc.trim(),
        hook: extHook,
        author: 'Local Dev (You)',
        enabled: true,
        [extHook]: evaluatedHook
      };

      onRegisterCustomExtension(customExt);
      
      // Reset form states
      setExtName('');
      setExtDesc('');
      setExtCode(`(ctx) => {\n  // edit hooks code here\n}`);
      setActiveTab('browse');
      alert(`✦ Extension "${customExt.name}" compiled and live-installed successfully under PNCPL-1.0!`);
    } catch (err) {
      alert(`⚠️ Compilation Error: ${err.message}`);
    }
  };

  return (
    <div className="extension-store animate-slide-up">
      {/* Store Header Tab Toggles */}
      <div className="store-header">
        <div className="header-text">
          <h2>pro://store ✦ Extension Center</h2>
          <p>Download secure modular plugins or upload your custom scripts under PNCPL-1.0 license.</p>
        </div>
        <div className="tab-pill-box">
          <button className={`tab-pill ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
            Browse Library
          </button>
          <button className={`tab-pill ${activeTab === 'developer' ? 'active' : ''}`} onClick={() => setActiveTab('developer')}>
            Developer Console
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div className="store-catalog-grid">
          {extensionCatalog.map((ext) => {
            const installed = activeExtensions.find(x => x.id === ext.id);
            const isInstalling = installingId === ext.id;
            
            return (
              <div key={ext.id} className={`glass-card catalog-card ${installed?.enabled ? 'active' : ''}`}>
                <div className="card-top-row">
                  <div>
                    <h4>{ext.name}</h4>
                    <p className="author">by {ext.author} ✦ v{ext.version}</p>
                  </div>
                  <span className={`hook-tag ${ext.hook}`}>{ext.hook}</span>
                </div>
                <p className="description">{ext.description}</p>
                
                <div className="card-footer">
                  {installed ? (
                    <button
                      className={`btn btn-sm ${installed.enabled ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => onToggleExtension(ext.id)}
                    >
                      {installed.enabled ? 'Disable Plugin' : 'Enable Plugin'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleInstall(ext.id)}
                      disabled={isInstalling}
                    >
                      {isInstalling ? 'Routing Pipeline...' : 'Live Install'}
                    </button>
                  )}
                  {installed?.enabled && <span className="active-label">● ACTIVE</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="developer-console-row">
          {/* Custom Compiler Composer Form */}
          <div className="glass-card developer-form-card">
            <h3>Extension Compiler</h3>
            <p className="subtitle">Write, compile, and inject your own extension scripts under PNCPL-1.0.</p>
            
            <form onSubmit={handleCreateExtension} className="dev-compiler-form">
              <div className="form-row-double">
                <div className="form-group">
                  <label>Plugin Name</label>
                  <input
                    type="text"
                    placeholder="Ad Blocker Pro..."
                    value={extName}
                    onChange={(e) => setExtName(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Target Lifecycle Hook</label>
                  <select
                    value={extHook}
                    onChange={(e) => setExtHook(e.target.value)}
                    className="input-field"
                  >
                    <option value="onPaint">onPaint (Canvas overlays)</option>
                    <option value="onDOMParsed">onDOMParsed (DOM modifications)</option>
                    <option value="onBeforeRequest">onBeforeRequest (Network blockages)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Summarize plugin operations..."
                  value={extDesc}
                  onChange={(e) => setExtDesc(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label>JavaScript Hook Script (PNCPL-1.0 Compatible)</label>
                <textarea
                  value={extCode}
                  onChange={(e) => setExtCode(e.target.value)}
                  className="input-field code-textarea"
                  spellCheck="false"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary submit-compiler-btn">
                Compile & Inject ✦
              </button>
            </form>
          </div>

          {/* Quick Guide */}
          <div className="glass-card guides-card">
            <h3>API Integration Quickstart</h3>
            <div className="guides-content">
              <strong>1. Canvas painting: onPaint</strong>
              <p>Exposes <code>CanvasRenderingContext2D</code>. Let's you draw custom widgets, outlines, grids, or visual notifications over the browser canvas layer.</p>
              
              <strong>2. DOM Manipulator: onDOMParsed</strong>
              <p>Receives the parsed DOM JSON AST tree. You can push text updates, change class parameters, or inject customized nodes programmatically.</p>
              
              <strong>3. Request intercept: onBeforeRequest</strong>
              <p>Intercepts network URL addresses. Return <code>{'{ block: true }'}</code> to strip trackers or block ad fetches before socket fetches occur.</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .extension-store {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .store-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
        }

        @media (max-width: 700px) {
          .store-header {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .header-text h2 {
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #fff 40%, var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-text p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: 0.2rem;
        }

        .tab-pill-box {
          display: flex;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          padding: 0.25rem;
          border-radius: 12px;
        }

        .tab-pill {
          padding: 0.5rem 1rem;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: inherit;
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all var(--transition-speed);
        }

        .tab-pill.active {
          background: var(--accent-color);
          color: #ffffff;
          box-shadow: 0 4px 10px var(--accent-glow);
        }

        .store-catalog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .catalog-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 180px;
          border-left: 4px solid var(--text-muted);
        }

        .catalog-card.active {
          border-left-color: var(--success-color);
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .catalog-card h4 {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .catalog-card .author {
          font-size: 0.72rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .hook-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.15rem 0.4rem;
          border-radius: 6px;
          border: 1px solid var(--glass-border);
          text-transform: uppercase;
        }

        .hook-tag.onPaint { background: rgba(139, 92, 246, 0.08); color: var(--accent-color); border-color: rgba(139, 92, 246, 0.2); }
        .hook-tag.onDOMParsed { background: rgba(245, 158, 11, 0.08); color: var(--warning-color); border-color: rgba(245, 158, 11, 0.2); }
        .hook-tag.onBeforeRequest { background: rgba(239, 68, 68, 0.08); color: var(--danger-color); border-color: rgba(239, 68, 68, 0.2); }

        .catalog-card .description {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 1.25rem;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }

        .active-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--success-color);
          text-shadow: 0 0 6px rgba(16, 185, 129, 0.3);
        }

        .developer-console-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .developer-console-row {
            grid-template-columns: 1fr;
          }
        }

        .developer-form-card h3 {
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .developer-form-card .subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }

        .dev-compiler-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-row-double {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .code-textarea {
          font-family: monospace;
          font-size: 0.78rem;
          line-height: 1.45;
          min-height: 160px;
          resize: vertical;
          background: rgba(0, 0, 0, 0.2) !important;
          color: #34d399 !important; /* Cyber emerald code color */
        }

        .submit-compiler-btn {
          align-self: flex-start;
          font-size: 0.88rem;
          padding: 0.6rem 1.5rem;
        }

        .guides-card h3 {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .guides-content {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .guides-content strong {
          display: block;
          font-size: 0.85rem;
          color: var(--accent-color);
        }

        .guides-content p {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
