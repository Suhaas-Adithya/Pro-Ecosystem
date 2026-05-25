import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import NotesView from './components/NotesView';
import TasksView from './components/TasksView';
import RemindersView from './components/RemindersView';
import AlarmsView from './components/AlarmsView';
import AlarmOverlay from './components/AlarmOverlay';
import { useLocalStorage } from './hooks/useLocalStorage';

// Standard Initial Seed Data (Curated to welcome the user elegantly)
const initialNotes = [
  {
    id: '1',
    title: 'Welcome to Pro Keep 🚀',
    content: 'Pro Keep combines Notes, Tasks, Reminders, and Alarms in a modern glassmorphic interface. Toggle dark/light themes on the bottom left sidebar, manage Kanban checklists, schedule alarms, and try out the polyphonic Web Audio alarm synthesizers!',
    category: 'personal',
    pinned: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Code Refactor Ideas',
    content: '1. Modularize context states.\n2. Optimize canvas renderings for analog clock clockfaces.\n3. Integrate secondary polyphonic synthesis themes.',
    category: 'work',
    pinned: false,
    createdAt: new Date().toISOString()
  }
];

const initialTasks = [
  {
    id: 't1',
    title: 'Polish CSS Animations 🌟',
    description: 'Ensure ringing bell keyframe sweeps smoothly and modals enter via custom Outfit transitions.',
    status: 'todo',
    category: 'work',
    priority: 'high',
    subtasks: [
      { id: 'ts1', text: 'Tweak bell rotation degrees', completed: false },
      { id: 'ts2', text: 'Optimize backdrop filters', completed: true }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 't2',
    title: 'Configure Notification Handlers',
    description: 'Hook up default requestPermission parameters to alert browsers natively.',
    status: 'in-progress',
    category: 'personal',
    priority: 'medium',
    subtasks: [
      { id: 'ts3', text: 'Write standard permission prompts', completed: true },
      { id: 'ts4', text: 'Implement chime alert audio context callbacks', completed: false }
    ],
    createdAt: new Date().toISOString()
  }
];

const initialReminders = [
  {
    id: '1',
    text: 'Schedule Pro Keep presentation 📊',
    datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2 hours from now
    category: 'work',
    priority: 'high',
    completed: false,
    notified: false
  },
  {
    id: '2',
    text: 'Drink water and stand up 💧',
    datetime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16), // 30 mins from now
    category: 'personal',
    priority: 'medium',
    completed: false,
    notified: false
  }
];

const initialAlarms = [
  {
    id: '1',
    time: '07:30',
    label: 'Morning Stretch',
    active: true,
    repeatDays: [1, 2, 3, 4, 5], // Mon-Fri
    snoozeMinutes: 5
  },
  {
    id: '2',
    time: '09:00',
    label: 'Weekend Rise',
    active: false,
    repeatDays: [0, 6], // Sat-Sun
    snoozeMinutes: 10
  }
];

// Audio Context holder to avoid garbage collection and dual initialization issues
let audioCtx = null;
let synthInterval = null;

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useLocalStorage('prokeep-theme', 'dark');

  // App States synchronized to LocalStorage
  const [notes, setNotes] = useLocalStorage('prokeep-notes', initialNotes);
  const [tasks, setTasks] = useLocalStorage('prokeep-tasks', initialTasks);
  const [reminders, setReminders] = useLocalStorage('prokeep-reminders', initialReminders);
  const [alarms, setAlarms] = useLocalStorage('prokeep-alarms', initialAlarms);

  // Background Trigger States
  const [activeAlarmTrigger, setActiveAlarmTrigger] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Keep track of alarms that triggered in the current minute to prevent multiple triggers
  const lastTriggeredMinute = useRef('');

  // 1. Notification Permission Request
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // 2. Theme setup on body element
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // 3. Polyphonic Melody Alarm Audio Synthesizer
  const playMelodicChimes = () => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume context if suspended (browser security policy)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (synthInterval) return;

      const triggerChime = () => {
        const now = audioCtx.currentTime;

        // Triad notes: E5 (659.25 Hz), G#5 (830.61 Hz), B5 (987.77 Hz)
        const notesFreq = [659.25, 830.61, 987.77];
        const delays = [0, 0.15, 0.3];

        notesFreq.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = idx === 2 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq, now + delays[idx]);

          gain.gain.setValueAtTime(0, now + delays[idx]);
          gain.gain.linearRampToValueAtTime(0.35, now + delays[idx] + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delays[idx] + 0.5);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(now + delays[idx]);
          osc.stop(now + delays[idx] + 0.55);
        });
      };

      // Play first chime instantly, then loop every 1.5 seconds
      triggerChime();
      synthInterval = setInterval(triggerChime, 1500);
    } catch (error) {
      console.warn('Web Audio synthesis failed:', error);
    }
  };

  const stopMelodicChimes = () => {
    if (synthInterval) {
      clearInterval(synthInterval);
      synthInterval = null;
    }
  };

  // 4. Background Ticker Loop checking Reminders and Alarms
  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;
      const dayVal = now.getDay(); // 0-6

      const localTimeFullStr = now.toISOString().split('T')[0] + 'T' + timeStr;

      // A. Check Alarm Matches
      if (timeStr !== lastTriggeredMinute.current) {
        alarms.forEach((alarm) => {
          if (alarm.active && alarm.time === timeStr) {
            // Check day recurrence matches
            const dayMatches = alarm.repeatDays.length === 0 || alarm.repeatDays.includes(dayVal);
            if (dayMatches && !activeAlarmTrigger) {
              lastTriggeredMinute.current = timeStr;
              setActiveAlarmTrigger(alarm);
              playMelodicChimes();

              // Send system push alert
              if (Notification.permission === 'granted') {
                new Notification(`Pro Keep Alarm: ${alarm.label || 'Time\'s Up!'}`, {
                  body: `Your scheduled alarm for ${alarm.time} is ringing!`,
                  icon: '/favicon.ico'
                });
              }
            }
          }
        });
      }

      // B. Check Reminder Matches
      reminders.forEach((rem) => {
        if (!rem.completed && !rem.notified) {
          const remTime = new Date(rem.datetime);
          if (now >= remTime) {
            // Set as notified to prevent duplicate triggers
            setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, notified: true } : r));

            // Create notification chime
            playNotificationChime();

            // Send system push alert
            if (Notification.permission === 'granted') {
              new Notification(`Reminder: ${rem.text}`, {
                body: `Scheduled for ${new Date(rem.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                icon: '/favicon.ico'
              });
            } else {
              alert(`🔔 Reminder: ${rem.text}`);
            }
          }
        }
      });

    }, 1000);

    return () => clearInterval(ticker);
  }, [alarms, reminders, activeAlarmTrigger]);

  // Synthesize a quick chime for reminders
  const playNotificationChime = () => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.4);
      });
    } catch (e) {
      console.warn("Chime failed:", e);
    }
  };

  // 5. Alarm Trigger Action Overlays
  const handleDismissAlarm = (alarm) => {
    stopMelodicChimes();
    setActiveAlarmTrigger(null);

    // If non-repeating alarm, turn active status off
    if (alarm.repeatDays.length === 0) {
      setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: false } : a));
    }
  };

  const handleSnoozeAlarm = (alarm) => {
    stopMelodicChimes();
    setActiveAlarmTrigger(null);

    // Calculate snooze time (minutes ahead)
    const snoozeTime = new Date(Date.now() + alarm.snoozeMinutes * 60 * 1000);
    const snoozeTimeStr = String(snoozeTime.getHours()).padStart(2, '0') + ':' + String(snoozeTime.getMinutes()).padStart(2, '0');

    // Create a temporary snooze alarm
    const snoozedAlarm = {
      id: `snooze-${Date.now()}`,
      time: snoozeTimeStr,
      label: `${alarm.label} (Snoozed)`,
      active: true,
      repeatDays: [], // Trigger once
      snoozeMinutes: alarm.snoozeMinutes
    };

    setAlarms(prev => [...prev, snoozedAlarm]);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // 6. Active Tab Router Render
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            notes={notes}
            reminders={reminders}
            alarms={alarms}
            setNotes={setNotes}
            setActiveTab={setActiveTab}
          />
        );
      case 'notes':
        return <NotesView notes={notes} setNotes={setNotes} />;
      case 'tasks':
        return <TasksView tasks={tasks} setTasks={setTasks} />;
      case 'reminders':
        return <RemindersView reminders={reminders} setReminders={setReminders} />;
      case 'alarms':
        return (
          <AlarmsView
            alarms={alarms}
            setAlarms={setAlarms}
            onTestSound={playNotificationChime}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="main-content">
        <header className="view-header">
          <div className="view-title">
            <h1 style={{ textTransform: 'capitalize' }}>{activeTab === 'dashboard' ? 'Control Center' : activeTab}</h1>
            <p>
              {activeTab === 'dashboard'
                ? 'Your premium visual scheduler at a glance'
                : `Manage your personal ${activeTab}`}
            </p>
          </div>
        </header>

        <div className="view-workspace-content">
          {renderActiveView()}
        </div>
      </main>

      <AlarmOverlay
        activeTrigger={activeAlarmTrigger}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
      />
    </div>
  );
}
