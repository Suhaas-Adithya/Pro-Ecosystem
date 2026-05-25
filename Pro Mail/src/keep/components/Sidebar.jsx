import React from 'react';
import { DashboardIcon, NotesIcon, TasksIcon, RemindersIcon, AlarmsIcon, SunIcon, MoonIcon } from './Icons';

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'notes', label: 'Notes', icon: <NotesIcon /> },
    { id: 'tasks', label: 'Tasks', icon: <TasksIcon /> },
    { id: 'reminders', label: 'Reminders', icon: <RemindersIcon /> },
    { id: 'alarms', label: 'Alarms', icon: <AlarmsIcon /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h2>Pro Keep</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activeTab === item.id && <span className="nav-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-switch-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: background-color var(--transition-speed);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .brand-logo {
          color: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 8px var(--accent-glow));
        }

        .sidebar-brand h2 {
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          font-size: 0.95rem;
          text-align: left;
          position: relative;
          transition: all var(--transition-speed);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: hsla(var(--hue), 20%, 100%, 0.03);
          transform: translateX(4px);
        }

        .nav-item.active {
          color: var(--accent-color);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          box-shadow: 0 4px 20px 0 var(--glass-shadow);
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--transition-speed);
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.1);
        }

        .nav-item.active .nav-icon {
          color: var(--accent-color);
          filter: drop-shadow(0 0 6px var(--accent-glow));
        }

        .nav-indicator {
          position: absolute;
          left: 0;
          width: 4px;
          height: 20px;
          background: var(--accent-color);
          border-radius: 0 4px 4px 0;
          top: calc(50% - 10px);
          box-shadow: 0 0 8px var(--accent-color);
        }

        .sidebar-footer {
          display: flex;
          justify-content: center;
          padding-top: 1.5rem;
          border-top: 1px solid var(--glass-border);
        }
      `}</style>
    </aside>
  );
}
