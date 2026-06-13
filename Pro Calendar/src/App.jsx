import React, { useState, useEffect } from 'react';
import './App.css'; // Assuming basic CSS is present

function App() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', day: 1, color: '#339af0' });

  useEffect(() => {
    const initApp = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/profile?uid=global_device');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }

        const eRes = await fetch('http://localhost:3001/api/events');
        if (eRes.ok) {
          const eData = await eRes.json();
          // Transform array of events into object keyed by day
          const eventsMap = {};
          eData.events.forEach(ev => {
            if (!eventsMap[ev.day]) eventsMap[ev.day] = [];
            eventsMap[ev.day].push(ev);
          });
          setEvents(eventsMap);
        }
      } catch (err) {
        console.warn('Init failed:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const handleSaveEvent = async () => {
    const dayInt = parseInt(newEvent.day, 10);
    if (!newEvent.title || isNaN(dayInt)) return;

    const eventToSave = { id: Date.now(), title: newEvent.title, day: dayInt, color: newEvent.color };
    try {
      await fetch('http://localhost:3001/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventToSave)
      });
      
      setEvents(prev => {
        const next = { ...prev };
        if (!next[dayInt]) next[dayInt] = [];
        next[dayInt].push(eventToSave);
        return next;
      });
      setShowNewModal(false);
      setNewEvent({ title: '', day: 1, color: '#339af0' });
    } catch (err) {
      alert('Failed to save event.');
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading Pro Calendar...</div>;
  if (!profile) return <div style={{ color: 'white', padding: 20 }}>Please sign into Pro Suite ecosystem via Pro Browser.</div>;

  return (
    <div className="calendar-app">
      <div className="sidebar">
        <button className="create-btn" onClick={() => setShowNewModal(true)}>
          <span>+</span> Create
        </button>
        
        <div className="mini-calendar" style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>
          <strong>May 2026</strong>
          <div style={{ marginTop: '10px' }}>
            S M T W T F S<br/>
            . . . . . 1 2<br/>
            3 4 5 6 7 8 9
          </div>
        </div>

        <div style={{ fontWeight: 600, marginBottom: '12px' }}>My Calendars</div>
        <div className="calendar-list">
          <div className="calendar-item">
            <input type="checkbox" defaultChecked />
            <div className="color-dot" style={{ backgroundColor: '#339af0' }}></div>
            {profile.username}
          </div>
          <div className="calendar-item">
            <input type="checkbox" defaultChecked />
            <div className="color-dot" style={{ backgroundColor: '#f06595' }}></div>
            Birthdays
          </div>
          <div className="calendar-item">
            <input type="checkbox" defaultChecked />
            <div className="color-dot" style={{ backgroundColor: '#20c997' }}></div>
            Work
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="current-date">May 2026</div>
          <div className="nav-arrows">
            <button className="arrow-btn">{'<'}</button>
            <button className="arrow-btn">{'>'}</button>
          </div>
          <button style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-normal)' }}>
            Month
          </button>
        </div>

        <div className="calendar-grid">
          {daysOfWeek.map(d => (
            <div className="day-header" key={d}>{d}</div>
          ))}
          
          {/* Pad empty days for May 2026 */}
          <div className="day-cell"></div>
          <div className="day-cell"></div>
          <div className="day-cell"></div>
          <div className="day-cell"></div>
          <div className="day-cell"></div>
          
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <div className={`day-cell ${day === 26 ? 'today' : ''}`} key={day}>
              <div className="day-number">{day}</div>
              {events[day] && events[day].map((ev, i) => (
                <div key={i} className="event-pill" style={{ backgroundColor: ev.color }}>
                  {ev.title}
                </div>
              ))}
            </div>
          ))}
        </div>

        {showNewModal && (
          <div className="modal-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="modal-content" style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 12, width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ margin: 0, color: 'white' }}>New Event</h3>
              
              <input type="text" placeholder="Event Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} style={inputStyle} />
              <input type="number" min="1" max="31" placeholder="Day (1-31)" value={newEvent.day} onChange={e => setNewEvent({...newEvent, day: e.target.value})} style={inputStyle} />
              <select value={newEvent.color} onChange={e => setNewEvent({...newEvent, color: e.target.value})} style={inputStyle}>
                <option value="#339af0">Blue (Personal)</option>
                <option value="#f06595">Pink (Birthday)</option>
                <option value="#20c997">Green (Work)</option>
              </select>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button onClick={() => setShowNewModal(false)} style={{ flex: 1, padding: 8, background: 'transparent', color: 'white', border: '1px solid gray', borderRadius: 6 }}>Cancel</button>
                <button onClick={handleSaveEvent} style={{ flex: 1, padding: 8, background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: 6 }}>Schedule</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'white',
  outline: 'none'
};

export default App;
