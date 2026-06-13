import React, { useState, useEffect } from 'react';

const apps = [
  { id: 'browser', name: 'Pro Browser', icon: '🌐', color: 'hsl(199, 89%, 48%)' },
  { id: 'mail', name: 'Pro Mail', icon: '📧', color: 'hsl(350, 80%, 55%)' },
  { id: 'keep', name: 'Pro Keep', icon: '📝', color: 'hsl(36, 100%, 50%)' },
  { id: 'chat', name: 'Pro Chat', icon: '💬', color: 'hsl(250, 85%, 65%)' },
  { id: 'meet', name: 'Pro Meet', icon: '📹', color: 'hsl(142, 70%, 45%)' },
  { id: 'drive', name: 'Pro Drive', icon: '☁️', color: 'hsl(271, 81%, 56%)' },
  { id: 'calendar', name: 'Pro Calendar', icon: '📅', color: 'hsl(199, 89%, 48%)' },
  { id: 'dev', name: 'Pro Dev', icon: '💻', color: 'hsl(250, 85%, 65%)' },
  { id: 'vault', name: 'Pro Vault', icon: '🔐', color: 'hsl(36, 100%, 50%)' },
  { id: 'hub', name: 'Pro Hub', icon: '🔔', color: 'hsl(350, 80%, 55%)' }
];

export default function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const launchApp = (appId) => {
    // If running in Electron, send IPC message to main process to spawn app
    if (window.electronAPI) {
      window.electronAPI.send('launch-app', appId);
    } else {
      console.log(`Fallback: Launching ${appId}`);
      alert(`Electron API not found. Please run within Pro Launcher to open ${appId}.`);
    }
  };

  return (
    <div className="launcher-container">
      <div className="launcher-header">
        <h1 className="clock">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h1>
        <p className="date">{time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="app-grid">
        {apps.map(app => (
          <button 
            key={app.id} 
            className="app-icon-btn"
            onClick={() => launchApp(app.id)}
            style={{ '--app-color': app.color }}
          >
            <div className="icon-container">
              {app.icon}
            </div>
            <span className="app-name">{app.name}</span>
          </button>
        ))}
      </div>

      <style>{`
        :root {
          --glass-bg: hsla(228, 20%, 10%, 0.4);
          --glass-border: hsla(228, 20%, 100%, 0.1);
        }

        body {
          margin: 0;
          font-family: 'Inter', system-ui, sans-serif;
          background: #000;
          color: white;
          overflow: hidden;
          background-image: 
            radial-gradient(circle at 50% 0%, hsla(250, 70%, 50%, 0.2) 0%, transparent 60%),
            radial-gradient(circle at 100% 100%, hsla(199, 70%, 50%, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, hsla(350, 70%, 50%, 0.15) 0%, transparent 50%);
        }

        .launcher-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          box-sizing: border-box;
        }

        .launcher-header {
          text-align: center;
          margin-bottom: 4rem;
          animation: slide-down 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .clock {
          font-size: 5rem;
          font-weight: 300;
          margin: 0;
          letter-spacing: -0.05em;
        }

        .date {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.5rem;
          font-weight: 400;
        }

        .app-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2.5rem 3rem;
          max-width: 900px;
          animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        .app-icon-btn {
          background: transparent;
          border: none;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 0;
        }

        .app-icon-btn:hover {
          transform: translateY(-8px) scale(1.05);
        }

        .icon-container {
          width: 80px;
          height: 80px;
          border-radius: 22px;
          background: var(--glass-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .app-icon-btn:hover .icon-container {
          background: rgba(255,255,255,0.1);
          border-color: var(--app-color);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4), 0 0 20px var(--app-color);
        }

        .app-name {
          font-size: 0.95rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          opacity: 0.9;
        }

        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
