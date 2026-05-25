import React, { useState } from 'react';
import { TrashIcon, PlusIcon, CloseIcon, EditIcon, AlarmsIcon, VolumeIcon } from './Icons';

export default function AlarmsView({ alarms, setAlarms, onTestSound }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);

  // Form states
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('');
  const [repeatDays, setRepeatDays] = useState([]); // Array of numbers 0-6 (0=Sun, 6=Sat)
  const [snoozeMinutes, setSnoozeMinutes] = useState(5);

  const daysOfWeek = [
    { label: 'S', value: 0, fullName: 'Sunday' },
    { label: 'M', value: 1, fullName: 'Monday' },
    { label: 'T', value: 2, fullName: 'Tuesday' },
    { label: 'W', value: 3, fullName: 'Wednesday' },
    { label: 'T', value: 4, fullName: 'Thursday' },
    { label: 'F', value: 5, fullName: 'Friday' },
    { label: 'S', value: 6, fullName: 'Saturday' },
  ];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!time) return;

    const newAlarm = {
      id: Date.now().toString(),
      time,
      label: label.trim() || 'Alarm',
      active: true,
      repeatDays,
      snoozeMinutes: parseInt(snoozeMinutes) || 5,
    };

    setAlarms([...alarms, newAlarm]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingAlarm || !time) return;

    const updated = alarms.map((al) =>
      al.id === editingAlarm.id
        ? { ...al, time, label: label.trim(), repeatDays, snoozeMinutes: parseInt(snoozeMinutes) || 5 }
        : al
    );

    setAlarms(updated);
    resetForm();
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this alarm?')) {
      setAlarms(alarms.filter((al) => al.id !== id));
      if (editingAlarm && editingAlarm.id === id) resetForm();
    }
  };

  const toggleAlarmActive = (id, e) => {
    e.stopPropagation();
    setAlarms(
      alarms.map((al) =>
        al.id === id ? { ...al, active: !al.active } : al
      )
    );
  };

  const toggleDay = (dayValue) => {
    if (repeatDays.includes(dayValue)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayValue));
    } else {
      setRepeatDays([...repeatDays, dayValue].sort());
    }
  };

  const resetForm = () => {
    setTime('07:00');
    setLabel('');
    setRepeatDays([]);
    setSnoozeMinutes(5);
    setEditingAlarm(null);
  };

  const startEdit = (al) => {
    setEditingAlarm(al);
    setTime(al.time);
    setLabel(al.label);
    setRepeatDays(al.repeatDays);
    setSnoozeMinutes(al.snoozeMinutes);
  };

  const formatAlarmDaysSummary = (repDays) => {
    if (repDays.length === 7) return 'Every day';
    if (repDays.length === 0) return 'Once';
    if (repDays.length === 5 && !repDays.includes(0) && !repDays.includes(6)) return 'Weekdays';
    if (repDays.length === 2 && repDays.includes(0) && repDays.includes(6)) return 'Weekends';
    return repDays.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ');
  };

  return (
    <div className="alarms-view animate-slide-up">
      {/* Upper Bar controls */}
      <div className="alarms-controls">
        <div className="sound-test-container glass-card">
          <VolumeIcon size={18} className="sound-icon" />
          <div className="sound-text-wrapper">
            <h4>Web Audio Synth</h4>
            <p>Polyphonic synthesized alarm chime</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onTestSound}>
            Test Alarm Sound
          </button>
        </div>

        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <PlusIcon size={18} /> Add Alarm
        </button>
      </div>

      {/* Alarms Masonry Grid list */}
      <div className="alarms-workspace">
        {alarms.length === 0 ? (
          <div className="empty-state">
            <p className="no-items-text">No alarms scheduled yet.</p>
          </div>
        ) : (
          <div className="alarms-grid">
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className={`glass-card alarm-card ${alarm.active ? 'active-glow' : 'inactive'}`}
                onClick={() => startEdit(alarm)}
              >
                <div className="alarm-card-header">
                  <span className="alarm-card-icon">
                    <AlarmsIcon size={20} className={alarm.active ? 'active-icon' : ''} />
                  </span>
                  <div
                    className={`toggle-switch ${alarm.active ? 'on' : 'off'}`}
                    onClick={(e) => toggleAlarmActive(alarm.id, e)}
                  >
                    <div className="toggle-knob" />
                  </div>
                </div>

                <div className="alarm-card-time-block">
                  <h2>{alarm.time}</h2>
                  <p className="alarm-card-label">{alarm.label || 'Alarm'}</p>
                </div>

                <div className="alarm-card-footer">
                  <p className="alarm-days-summary">
                    {formatAlarmDaysSummary(alarm.repeatDays)}
                  </p>
                  <div className="alarm-actions">
                    <button
                      className="note-action-btn edit"
                      onClick={(e) => { e.stopPropagation(); startEdit(alarm); }}
                      title="Edit alarm"
                    >
                      <EditIcon size={13} />
                    </button>
                    <button
                      className="note-action-btn delete"
                      onClick={(e) => handleDelete(alarm.id, e)}
                      title="Delete alarm"
                    >
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Alarm Modal */}
      {(showAddModal || editingAlarm) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAlarm ? 'Edit Alarm' : 'Add Alarm'}</h3>
              <button className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={editingAlarm ? handleUpdate : handleCreate} className="alarm-form">
              <div className="form-group">
                <label>Set Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="input-field time-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Alarm Label</label>
                <input
                  type="text"
                  placeholder="E.g. Rise and shine..."
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Repeat Days</label>
                <div className="days-picker-pad">
                  {daysOfWeek.map((day) => {
                    const isSelected = repeatDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        className={`day-pick-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleDay(day.value)}
                        title={day.fullName}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>Snooze Duration (Minutes)</label>
                <select
                  value={snoozeMinutes}
                  onChange={(e) => setSnoozeMinutes(e.target.value)}
                  className="input-field"
                >
                  <option value={2}>2 Minutes</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAlarm ? 'Save Alarm' : 'Create Alarm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .alarms-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .alarms-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        @media (max-width: 700px) {
          .alarms-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .sound-test-container {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1.25rem;
          flex: 1;
          max-width: 500px;
          border-left: 4px solid var(--accent-color);
        }

        .sound-icon {
          color: var(--accent-color);
        }

        .sound-text-wrapper h4 {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .sound-text-wrapper p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .alarms-workspace {
          margin-top: 1rem;
        }

        .alarms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
        }

        /* Alarm Card Styling */
        .alarm-card {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 180px;
        }

        .alarm-card.active-glow {
          border-color: hsla(38, 92%, 50%, 0.3);
          box-shadow: 0 8px 32px 0 hsla(38, 92%, 50%, 0.1);
        }

        .alarm-card.inactive {
          opacity: 0.65;
        }

        .alarm-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alarm-card-icon {
          color: var(--text-muted);
          display: flex;
        }

        .active-icon {
          color: var(--warning-color);
          filter: drop-shadow(0 0 6px rgba(250, 180, 50, 0.4));
        }

        /* Premium Glass Switch Toggle */
        .toggle-switch {
          width: 44px;
          height: 24px;
          border-radius: 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          position: relative;
          cursor: pointer;
          transition: all var(--transition-speed);
        }

        .toggle-switch.on {
          background: var(--warning-color);
          border-color: var(--warning-color);
          box-shadow: 0 0 8px hsla(38, 92%, 50%, 0.4);
        }

        .toggle-knob {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform var(--transition-speed) cubic-bezier(0.4, 0, 0.2, 1);
        }

        .toggle-switch.on .toggle-knob {
          transform: translateX(20px);
        }

        .alarm-card-time-block {
          margin: 0.5rem 0;
        }

        .alarm-card-time-block h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 2.25rem;
          font-weight: 700;
          line-height: 1;
        }

        .alarm-card-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-top: 0.15rem;
          font-weight: 500;
        }

        .alarm-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.75rem;
          border-top: 1px solid var(--glass-border);
        }

        .alarm-days-summary {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .alarm-actions {
          display: flex;
          gap: 0.25rem;
        }

        /* Modal specific form */
        .alarm-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .time-input {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          font-family: 'Outfit', sans-serif;
        }

        .days-picker-pad {
          display: flex;
          justify-content: space-between;
          gap: 0.25rem;
        }

        .day-pick-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-speed);
        }

        .day-pick-btn:hover {
          color: var(--text-primary);
          background: var(--glass-border);
        }

        .day-pick-btn.selected {
          background: var(--warning-color);
          color: #fff;
          border-color: var(--warning-color);
          box-shadow: 0 0 10px hsla(38, 92%, 50%, 0.35);
        }
      `}</style>
    </div>
  );
}
