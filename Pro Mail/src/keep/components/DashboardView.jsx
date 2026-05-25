import React, { useState } from 'react';
import ClockWidget from './ClockWidget';
import { PinIcon, BellIcon, AlarmsIcon, PlusIcon, NotesIcon } from './Icons';

export default function DashboardView({ notes, reminders, alarms, setNotes, setActiveTab }) {
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteContent, setQuickNoteContent] = useState('');
  const [quickNoteCategory, setQuickNoteCategory] = useState('personal');

  // Math stats for reminders
  const today = new Date().toISOString().split('T')[0];
  const todayReminders = reminders.filter(r => r.datetime.startsWith(today));
  const completedToday = todayReminders.filter(r => r.completed).length;
  const totalToday = todayReminders.length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Next active alarm
  const activeAlarms = alarms.filter(a => a.active);
  const nextAlarm = activeAlarms.length > 0 ? activeAlarms[0] : null;

  // Upcoming 3 reminders
  const upcomingReminders = reminders
    .filter(r => !r.completed && new Date(r.datetime) >= new Date())
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    .slice(0, 3);

  // Pinned Notes
  const pinnedNotes = notes.filter(n => n.pinned).slice(0, 2);

  const handleQuickNoteSubmit = (e) => {
    e.preventDefault();
    if (!quickNoteContent.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      title: quickNoteTitle.trim() || 'Untitled Note',
      content: quickNoteContent.trim(),
      category: quickNoteCategory,
      pinned: false,
      createdAt: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    setQuickNoteTitle('');
    setQuickNoteContent('');
  };

  return (
    <div className="dashboard-grid animate-slide-up">
      {/* Row 1: Clock Widget & Stats Circular Wheel */}
      <div className="dashboard-row-1">
        <ClockWidget />

        <div className="glass-card stat-wheel-card">
          <div className="progress-ring-container">
            <svg width="100" height="100" className="progress-ring">
              <circle cx="50" cy="50" r="42" className="progress-ring-bg" />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="progress-ring-fill"
                style={{
                  strokeDasharray: `${2 * Math.PI * 42}`,
                  strokeDashoffset: `${2 * Math.PI * 42 * (1 - progressPercent / 100)}`
                }}
              />
            </svg>
            <div className="progress-text">
              <h2>{progressPercent}%</h2>
              <p>Done</p>
            </div>
          </div>
          <div className="stat-text">
            <h3>Today's Agendas</h3>
            <p>{completedToday} of {totalToday} reminders finished</p>
            <button className="stats-link-btn" onClick={() => setActiveTab('reminders')}>
              Manage Reminders →
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Grid of Quick Composer, Alarms Status & Upcoming Reminders */}
      <div className="dashboard-row-2">
        {/* Quick Note Composer */}
        <div className="glass-card quick-note-card">
          <div className="card-header">
            <NotesIcon size={18} className="card-header-icon" />
            <h3>Quick Note</h3>
          </div>
          <form onSubmit={handleQuickNoteSubmit} className="quick-note-form">
            <input
              type="text"
              placeholder="Title..."
              value={quickNoteTitle}
              onChange={(e) => setQuickNoteTitle(e.target.value)}
              className="input-field quick-note-title"
            />
            <textarea
              placeholder="Jot something down..."
              value={quickNoteContent}
              onChange={(e) => setQuickNoteContent(e.target.value)}
              className="input-field quick-note-content"
              required
            />
            <div className="quick-note-footer">
              <select
                value={quickNoteCategory}
                onChange={(e) => setQuickNoteCategory(e.target.value)}
                className="input-field category-select"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="ideas">Ideas</option>
                <option value="tasks">Todo</option>
              </select>
              <button type="submit" className="btn btn-primary btn-sm">
                <PlusIcon size={16} /> Save
              </button>
            </div>
          </form>
        </div>

        {/* Status Center (Alarms & Reminders overview) */}
        <div className="dashboard-column-stack">
          {/* Active Alarm Hub */}
          <div className="glass-card alarm-status-card" onClick={() => setActiveTab('alarms')}>
            <div className="card-header">
              <AlarmsIcon size={18} className="card-header-icon alarm" />
              <h3>Active Alarm</h3>
            </div>
            {nextAlarm ? (
              <div className="alarm-active-info">
                <div className="alarm-big-time">{nextAlarm.time}</div>
                <div className="alarm-label">{nextAlarm.label || 'Alarm'}</div>
                <div className="alarm-days">
                  {nextAlarm.repeatDays.length === 7
                    ? 'Every day'
                    : nextAlarm.repeatDays.length === 0
                    ? 'Once'
                    : nextAlarm.repeatDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                </div>
              </div>
            ) : (
              <p className="no-items-text">No active alarms set</p>
            )}
          </div>

          {/* Upcoming Reminders List */}
          <div className="glass-card upcoming-reminders-card" onClick={() => setActiveTab('reminders')}>
            <div className="card-header">
              <BellIcon size={18} className="card-header-icon bell" />
              <h3>Upcoming Reminders</h3>
            </div>
            <div className="upcoming-list">
              {upcomingReminders.length > 0 ? (
                upcomingReminders.map(rem => (
                  <div key={rem.id} className="upcoming-item">
                    <span className={`dot ${rem.category}`} />
                    <div className="upcoming-details">
                      <p className="upcoming-title">{rem.text}</p>
                      <p className="upcoming-time">
                        {new Date(rem.datetime).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-items-text">No pending upcoming reminders</p>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Notes Grid */}
        <div className="glass-card pinned-notes-card">
          <div className="card-header">
            <PinIcon size={18} className="card-header-icon pin" fill="var(--accent-color)" />
            <h3>Pinned Notes</h3>
          </div>
          <div className="pinned-notes-list">
            {pinnedNotes.length > 0 ? (
              pinnedNotes.map(note => (
                <div key={note.id} className={`pinned-note-item border-${note.category}`}>
                  <h4>{note.title}</h4>
                  <p>{note.content}</p>
                </div>
              ))
            ) : (
              <div className="no-pinned-wrapper" onClick={() => setActiveTab('notes')}>
                <p className="no-items-text">No pinned notes</p>
                <button className="stats-link-btn text-center">Browse all notes</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .dashboard-row-1 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        @media (max-width: 900px) {
          .dashboard-row-1 {
            grid-template-columns: 1fr;
          }
        }

        .stat-wheel-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: linear-gradient(135deg, var(--glass-bg), hsla(142, 70%, 45%, 0.02));
        }

        .progress-ring-container {
          position: relative;
          width: 100px;
          height: 100px;
          flex-shrink: 0;
        }

        .progress-ring {
          transform: rotate(-90deg);
        }

        .progress-ring-bg {
          fill: none;
          stroke: var(--bg-tertiary);
          stroke-width: 8;
        }

        .progress-ring-fill {
          fill: none;
          stroke: var(--success-color);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.4s ease;
        }

        .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .progress-text h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .progress-text p {
          font-size: 0.65rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-text h3 {
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }

        .stat-text p {
          color: var(--text-secondary);
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
        }

        .stats-link-btn {
          background: none;
          border: none;
          color: var(--accent-color);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          padding: 0;
          transition: color var(--transition-speed);
        }

        .stats-link-btn:hover {
          color: var(--accent-hover);
        }

        .dashboard-row-2 {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1.2fr;
          gap: 2rem;
        }

        @media (max-width: 1100px) {
          .dashboard-row-2 {
            grid-template-columns: 1fr;
          }
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.75rem;
        }

        .card-header-icon {
          color: var(--text-secondary);
        }

        .card-header-icon.alarm { color: var(--warning-color); }
        .card-header-icon.bell { color: var(--accent-color); }

        .quick-note-form {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .quick-note-title {
          font-weight: 600;
        }

        .quick-note-content {
          min-height: 100px;
          resize: none;
        }

        .quick-note-footer {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          justify-content: space-between;
        }

        .category-select {
          width: auto;
          flex: 1;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        .dashboard-column-stack {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .alarm-status-card, .upcoming-reminders-card {
          cursor: pointer;
        }

        .alarm-big-time {
          font-size: 2rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          color: var(--warning-color);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .alarm-label {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .alarm-days {
          color: var(--text-secondary);
          font-size: 0.8rem;
          margin-top: 0.15rem;
        }

        .no-items-text {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-style: italic;
        }

        .upcoming-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upcoming-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--glass-border);
        }

        .upcoming-item:last-child {
          border-bottom: none;
        }

        .upcoming-details {
          flex: 1;
        }

        .upcoming-title {
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .upcoming-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-top: 0.1rem;
        }

        .pinned-notes-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .pinned-note-item {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: var(--bg-tertiary);
          border-left: 4px solid var(--text-muted);
        }

        .pinned-note-item.border-personal { border-left-color: var(--color-personal); }
        .pinned-note-item.border-work { border-left-color: var(--color-work); }
        .pinned-note-item.border-ideas { border-left-color: var(--color-ideas); }
        .pinned-note-item.border-tasks { border-left-color: var(--color-tasks); }

        .pinned-note-item h4 {
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
          font-weight: 600;
        }

        .pinned-note-item p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-pinned-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem 0;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
