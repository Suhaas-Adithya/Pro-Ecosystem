import React, { useState } from 'react';
import { TrashIcon, SearchIcon, PlusIcon, CalendarIcon, CloseIcon, EditIcon, CheckIcon } from './Icons';

export default function RemindersView({ reminders, setReminders }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // Form states
  const [text, setText] = useState('');
  const [datetime, setDatetime] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');

  const categories = [
    { id: 'all', label: 'All', class: '' },
    { id: 'personal', label: 'Personal', class: 'personal' },
    { id: 'work', label: 'Work', class: 'work' },
    { id: 'ideas', label: 'Ideas', class: 'ideas' },
    { id: 'tasks', label: 'Todo', class: 'tasks' },
  ];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!text.trim() || !datetime) return;

    const newReminder = {
      id: Date.now().toString(),
      text: text.trim(),
      datetime,
      category,
      priority,
      completed: false,
      notified: false,
    };

    setReminders([newReminder, ...reminders]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingReminder || !text.trim() || !datetime) return;

    const updated = reminders.map((rem) =>
      rem.id === editingReminder.id
        ? { ...rem, text: text.trim(), datetime, category, priority }
        : rem
    );

    setReminders(updated);
    resetForm();
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter((rem) => rem.id !== id));
      if (editingReminder && editingReminder.id === id) resetForm();
    }
  };

  const toggleComplete = (id, e) => {
    e.stopPropagation();
    setReminders(
      reminders.map((rem) =>
        rem.id === id ? { ...rem, completed: !rem.completed } : rem
      )
    );
  };

  const resetForm = () => {
    setText('');
    setDatetime('');
    setCategory('personal');
    setPriority('medium');
    setEditingReminder(null);
  };

  const startEdit = (rem) => {
    setEditingReminder(rem);
    setText(rem.text);
    setDatetime(rem.datetime);
    setCategory(rem.category);
    setPriority(rem.priority);
  };

  // Logic to separate reminders chronologically
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredReminders = reminders.filter((rem) => {
    const matchesSearch = rem.text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rem.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getRemindersGroup = () => {
    const groups = {
      overdue: [],
      today: [],
      upcoming: [],
      completed: [],
    };

    filteredReminders.forEach((rem) => {
      if (rem.completed) {
        groups.completed.push(rem);
      } else {
        const remDate = new Date(rem.datetime);
        const remDateStr = rem.datetime.split('T')[0];

        if (remDate < now) {
          groups.overdue.push(rem);
        } else if (remDateStr === todayStr) {
          groups.today.push(rem);
        } else {
          groups.upcoming.push(rem);
        }
      }
    });

    // Sort chronologically
    groups.overdue.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    groups.today.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    groups.upcoming.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    groups.completed.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    return groups;
  };

  const groups = getRemindersGroup();

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="reminders-view animate-slide-up">
      {/* Search & Add Controls */}
      <div className="reminders-controls">
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field search-input"
          />
        </div>

        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <PlusIcon size={18} /> Add Reminder
        </button>
      </div>

      {/* Categories chips filter */}
      <div className="category-chips">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.id !== 'all' && <span className={`dot ${cat.id}`} style={{ marginRight: '6px' }} />}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Lists grouped by due status */}
      <div className="reminders-list-container">
        {filteredReminders.length === 0 ? (
          <div className="empty-state">
            <p className="no-items-text">No reminders found.</p>
          </div>
        ) : (
          <div className="reminders-sections-stack">
            {/* Overdue */}
            {groups.overdue.length > 0 && (
              <div className="reminder-section glass-card border-overdue">
                <h3 className="section-title overdue">Overdue</h3>
                <div className="rem-list">
                  {groups.overdue.map((rem) => (
                    <ReminderRow
                      key={rem.id}
                      rem={rem}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      badgeClass={getPriorityBadgeClass}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Today */}
            {groups.today.length > 0 && (
              <div className="reminder-section glass-card border-today">
                <h3 className="section-title today">Today</h3>
                <div className="rem-list">
                  {groups.today.map((rem) => (
                    <ReminderRow
                      key={rem.id}
                      rem={rem}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      badgeClass={getPriorityBadgeClass}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {groups.upcoming.length > 0 && (
              <div className="reminder-section glass-card border-upcoming">
                <h3 className="section-title upcoming">Upcoming</h3>
                <div className="rem-list">
                  {groups.upcoming.map((rem) => (
                    <ReminderRow
                      key={rem.id}
                      rem={rem}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      badgeClass={getPriorityBadgeClass}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {groups.completed.length > 0 && (
              <div className="reminder-section glass-card border-completed">
                <h3 className="section-title completed">Completed</h3>
                <div className="rem-list">
                  {groups.completed.map((rem) => (
                    <ReminderRow
                      key={rem.id}
                      rem={rem}
                      onToggle={toggleComplete}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      badgeClass={getPriorityBadgeClass}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showAddModal || editingReminder) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingReminder ? 'Edit Reminder' : 'Add Reminder'}</h3>
              <button className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={editingReminder ? handleUpdate : handleCreate} className="rem-form">
              <div className="form-group">
                <label>Reminder Text</label>
                <input
                  type="text"
                  placeholder="E.g. Pay electrical bill..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label>Date & Time</label>
                <div className="datetime-input-wrapper">
                  <CalendarIcon className="calendar-icon" size={16} />
                  <input
                    type="datetime-local"
                    value={datetime}
                    onChange={(e) => setDatetime(e.target.value)}
                    className="input-field datetime-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row-double">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="ideas">Ideas</option>
                    <option value="tasks">Todo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReminder ? 'Save Reminder' : 'Add Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .reminders-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .reminders-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        @media (max-width: 600px) {
          .reminders-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .reminders-list-container {
          margin-top: 1rem;
        }

        .reminders-sections-stack {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .reminder-section {
          padding: 1.25rem 1.5rem;
          border-left: 4px solid var(--text-muted);
        }

        .reminder-section.border-overdue { border-left-color: var(--danger-color); }
        .reminder-section.border-today { border-left-color: var(--warning-color); }
        .reminder-section.border-upcoming { border-left-color: var(--accent-color); }
        .reminder-section.border-completed { border-left-color: var(--success-color); }

        .section-title.overdue { color: var(--danger-color); }
        .section-title.today { color: var(--warning-color); }
        .section-title.upcoming { color: var(--accent-color); }
        .section-title.completed { color: var(--success-color); }

        .rem-list {
          display: flex;
          flex-direction: column;
          margin-top: 0.75rem;
        }

        /* Reminder Row Details */
        .rem-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 0.5rem;
          border-bottom: 1px solid var(--glass-border);
          transition: all var(--transition-speed);
        }

        .rem-row:last-child {
          border-bottom: none;
        }

        .rem-row:hover {
          background: hsla(var(--hue), 20%, 100%, 0.02);
        }

        .checkbox-wrapper {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid var(--text-muted);
          background: transparent;
          transition: all var(--transition-speed);
        }

        .checkbox-wrapper.checked {
          background: var(--success-color);
          border-color: var(--success-color);
          color: #fff;
          box-shadow: 0 0 6px hsla(142, 70%, 45%, 0.3);
        }

        .checkbox-wrapper.checked .check-icon {
          display: flex;
        }

        .check-icon {
          display: none;
          color: #fff;
        }

        .rem-content-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .rem-text {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
          transition: all var(--transition-speed);
        }

        .rem-text.completed-line {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        .rem-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .rem-time {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .rem-badge {
          font-size: 0.65rem;
          padding: 0.15rem 0.5rem;
          border-radius: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .priority-high {
          background: hsla(350, 80%, 55%, 0.1);
          color: var(--danger-color);
          border: 1px solid hsla(350, 80%, 55%, 0.2);
        }

        .priority-medium {
          background: hsla(38, 92%, 50%, 0.1);
          color: var(--warning-color);
          border: 1px solid hsla(38, 92%, 50%, 0.2);
        }

        .priority-low {
          background: hsla(199, 89%, 48%, 0.1);
          color: var(--color-personal);
          border: 1px solid hsla(199, 89%, 48%, 0.2);
        }

        .rem-row-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity var(--transition-speed);
        }

        .rem-row:hover .rem-row-actions {
          opacity: 1;
        }

        /* Modal Forms layout */
        .rem-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .datetime-input-wrapper {
          position: relative;
        }

        .calendar-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .datetime-input {
          padding-left: 2.5rem;
        }

        .form-row-double {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}

// Subcomponent ReminderRow
function ReminderRow({ rem, onToggle, onEdit, onDelete, badgeClass }) {
  const isOverdue = !rem.completed && new Date(rem.datetime) < new Date();
  
  const formattedDateTime = new Date(rem.datetime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="rem-row">
      <div className={`checkbox-wrapper ${rem.completed ? 'checked' : ''}`} onClick={(e) => onToggle(rem.id, e)}>
        <CheckIcon size={12} className="check-icon" />
      </div>

      <div className="rem-content-box" onClick={() => onEdit(rem)}>
        <span className={`rem-text ${rem.completed ? 'completed-line' : ''}`}>
          {rem.text}
        </span>
        <div className="rem-meta">
          <span className="rem-time" style={isOverdue ? { color: 'var(--danger-color)' } : {}}>
            <CalendarIcon size={10} /> {formattedDateTime} {isOverdue && '(Overdue)'}
          </span>
          <span className={`dot ${rem.category}`} title={rem.category} />
          <span className={`rem-badge ${badgeClass(rem.priority)}`}>
            {rem.priority}
          </span>
        </div>
      </div>

      <div className="rem-row-actions">
        <button
          className="note-action-btn edit"
          onClick={() => onEdit(rem)}
          title="Edit reminder"
        >
          <EditIcon size={13} />
        </button>
        <button
          className="note-action-btn delete"
          onClick={(e) => onDelete(rem.id, e)}
          title="Delete reminder"
        >
          <TrashIcon size={13} />
        </button>
      </div>
    </div>
  );
}
