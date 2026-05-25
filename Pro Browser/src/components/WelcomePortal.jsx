import React, { useState } from 'react';

export default function WelcomePortal({ onNavigate }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const pillars = [
    {
      title: "100% Shared Open Source",
      badge: "PNCPL-1.0",
      description: "Unlike Microsoft, Apple, or Google, our entire ecosystem—from the custom canvas browser rendering engine to the P2P video signaling backend and agent loop runner—is open-sourced for community audit. You are in complete control of your data, free to study, customize, and extend it.",
      icon: "🌐"
    },
    {
      title: "Zero-Latency Tethered Mesh",
      badge: "Local Sync",
      description: "Connecting apps through port 3001 Node WebSockets establishes a localized real-time data bus. Completing a Kanban checklist in Keep immediately updates Mail, and video standup triggers instantly schedule chimes across all active views without cloud latency.",
      icon: "⚡"
    },
    {
      title: "Gemma 4 Edge AI Core",
      badge: "Agentic Autopilot",
      description: "Equipped with autonomous developer subagents that run linter bug-check scripts, resolve task sequencing dependency conflicts, generate schedule agendas, and chime audio standup briefs locally with beautiful glowing gradients.",
      icon: "🧠"
    }
  ];

  const competitors = [
    { category: "Docs & Office", competitor: "Google Workspace / Office 365", proSolution: "Pro Docs & Sheets (pro://docs, pro://sheets)", reason: "100% Offline-ready, built-in formula compilers, and integrated Markdown workflows." },
    { category: "Web Browsing", competitor: "Google Chrome / Edge (Chromium)", proSolution: "Pro Browser (no Chromium/Blink)", reason: "Custom 2D canvas micro-engine, no analytics or tracking, and server-side sandbox vector streams." },
    { category: "Team Messaging", competitor: "Slack / Teams", proSolution: "Pro Chat (pro://chat) & Pro Meet", reason: "Direct task code embeds (/task), built-in huddles, and secure P2P channels." },
    { category: "Code Editor", competitor: "VS Code / Cursor", proSolution: "Pro Dev (Gemma 4 ADE)", reason: "Multi-step agent autopilot loops, tool tracking visual logs, and instant split diff builders." }
  ];

  return (
    <div className="welcome-portal animate-slide-up">
      <div className="welcome-hero">
        <div className="sparkle-core">✦</div>
        <h1>Welcome to Pro Suite</h1>
        <p>The first fully-tethered, agentic, and open-source virtual operating environment.</p>
      </div>

      <div className="dashboard-row-1">
        {/* Core Pillars Carousel */}
        <div className="glass-card carousel-card">
          <div className="carousel-header">
            <h3>Ecosystem Core Pillars</h3>
            <div className="carousel-dots">
              {pillars.map((_, i) => (
                <button
                  key={i}
                  className={`dot-btn ${activeSlide === i ? 'active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                />
              ))}
            </div>
          </div>
          <div className="carousel-body">
            <span className="pillar-icon">{pillars[activeSlide].icon}</span>
            <div className="pillar-title-row">
              <h4>{pillars[activeSlide].title}</h4>
              <span className="pillar-badge">{pillars[activeSlide].badge}</span>
            </div>
            <p>{pillars[activeSlide].description}</p>
          </div>
        </div>

        {/* Dynamic Action Panel */}
        <div className="glass-card cta-card">
          <h3>Launch Core Apps</h3>
          <p>Instantly launch other tethered nodes inside local sandbox ports:</p>
          <div className="cta-grid">
            <button className="cta-btn" onClick={() => onNavigate('http://localhost:5173')}>
              <span>📝</span>
              <div>
                <strong>Pro Keep</strong>
                <p>Task Kanban & Alarms</p>
              </div>
            </button>
            <button className="cta-btn" onClick={() => onNavigate('http://localhost:5176')}>
              <span>⚙️</span>
              <div>
                <strong>Pro Dev (ADE)</strong>
                <p>Code Editor & Agents</p>
              </div>
            </button>
            <button className="cta-btn" onClick={() => onNavigate('pro://store')}>
              <span>🛒</span>
              <div>
                <strong>Extension Store</strong>
                <p>Dynamic App Plugins</p>
              </div>
            </button>
            <button className="cta-btn" onClick={() => onNavigate('pro://docs')}>
              <span>📑</span>
              <div>
                <strong>Pro Docs</strong>
                <p>Markdown Workspace</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Competitors Matrix */}
      <div className="glass-card matrix-card">
        <h3>Why Pro? The Comparative Matrix</h3>
        <p className="subtitle">See how the Pro Suite challenges corporate software monopolies by prioritizing user freedom.</p>
        <div className="matrix-table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Traditional Competitor</th>
                <th>The Pro Alternative</th>
                <th>The Open-Source Advantage</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((row, index) => (
                <tr key={index}>
                  <td className="font-bold text-accent">{row.category}</td>
                  <td className="text-muted">{row.competitor}</td>
                  <td><strong>{row.proSolution}</strong></td>
                  <td className="text-success">✓ {row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .welcome-portal {
          max-width: 1000px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 3rem;
        }

        .welcome-hero {
          text-align: center;
          padding: 2.5rem 1rem;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent);
          border-radius: 20px;
          border: 1px solid var(--glass-border);
          position: relative;
          overflow: hidden;
        }

        .sparkle-core {
          font-size: 2.5rem;
          color: var(--accent-color);
          text-shadow: 0 0 15px var(--accent-glow);
          margin-bottom: 0.5rem;
          animation: pulse 2s infinite ease-in-out;
        }

        .welcome-hero h1 {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #fff 40%, var(--accent-color));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .welcome-hero p {
          color: var(--text-secondary);
          margin-top: 0.5rem;
          font-size: 1.1rem;
        }

        .dashboard-row-1 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 800px) {
          .dashboard-row-1 {
            grid-template-columns: 1fr;
          }
        }

        .carousel-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 250px;
        }

        .carousel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.75rem;
          margin-bottom: 1rem;
        }

        .carousel-dots {
          display: flex;
          gap: 0.4rem;
        }

        .dot-btn {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: none;
          background: var(--bg-tertiary);
          cursor: pointer;
          transition: all var(--transition-speed);
        }

        .dot-btn.active {
          background: var(--accent-color);
          box-shadow: 0 0 8px var(--accent-color);
          transform: scale(1.2);
        }

        .carousel-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .pillar-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 8px var(--accent-glow));
        }

        .pillar-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .pillar-title-row h4 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .pillar-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          background: var(--accent-glow);
          color: var(--accent-color);
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }

        .carousel-body p {
          color: var(--text-secondary);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .cta-card {
          display: flex;
          flex-direction: column;
        }

        .cta-card h3 {
          margin-bottom: 0.25rem;
        }

        .cta-card > p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1.25rem;
        }

        .cta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          flex: 1;
        }

        .cta-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: all var(--transition-speed);
        }

        .cta-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--accent-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px var(--accent-glow);
        }

        .cta-btn span {
          font-size: 1.5rem;
        }

        .cta-btn strong {
          display: block;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .cta-btn p {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 0.1rem;
        }

        .matrix-card h3 {
          margin-bottom: 0.15rem;
        }

        .matrix-card .subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .matrix-table-wrapper {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
        }

        .matrix-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }

        .matrix-table th, .matrix-table td {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .matrix-table th {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .matrix-table tr:last-child td {
          border-bottom: none;
        }

        .text-accent {
          color: var(--accent-color);
        }

        .text-muted {
          color: var(--text-muted);
        }

        .text-success {
          color: var(--success-color);
        }
      `}</style>
    </div>
  );
}
