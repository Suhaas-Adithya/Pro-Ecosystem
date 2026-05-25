import React, { useState, useEffect, useRef } from 'react';
import DashboardView from '../keep/components/DashboardView';
import NotesView from '../keep/components/NotesView';
import TasksView from '../keep/components/TasksView';
import RemindersView from '../keep/components/RemindersView';
import AlarmsView from '../keep/components/AlarmsView';
import AlarmOverlay from '../keep/components/AlarmOverlay';
import { useLocalStorage } from '../keep/hooks/useLocalStorage';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, FileText, CheckSquare, Bell, Clock, Sparkles } from 'lucide-react';
import '../keep/keep.css';

// Initial Seed Data
const initialNotes = [
  {
    id: '1',
    title: 'Welcome to Pro Keep 🚀',
    content: 'Pro Keep combines Notes, Tasks, Reminders, and Alarms in a modern glassmorphic interface. Manage Kanban checklists, schedule alarms, and try out the polyphonic Web Audio alarm synthesizers!',
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
    datetime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    category: 'work',
    priority: 'high',
    completed: false,
    notified: false
  },
  {
    id: '2',
    text: 'Drink water and stand up 💧',
    datetime: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 16),
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
    repeatDays: [1, 2, 3, 4, 5],
    snoozeMinutes: 5
  },
  {
    id: '2',
    time: '09:00',
    label: 'Weekend Rise',
    active: false,
    repeatDays: [0, 6],
    snoozeMinutes: 10
  }
];

let audioCtx = null;
let synthInterval = null;

export default function Keep() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [notes, setNotes] = useLocalStorage('prokeep-notes', initialNotes);
  const [tasks, setTasks] = useLocalStorage('prokeep-tasks', initialTasks);
  const [reminders, setReminders] = useLocalStorage('prokeep-reminders', initialReminders);
  const [alarms, setAlarms] = useLocalStorage('prokeep-alarms', initialAlarms);

  const [activeAlarmTrigger, setActiveAlarmTrigger] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const lastTriggeredMinute = useRef('');

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

  const playMelodicChimes = () => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      if (synthInterval) return;

      const triggerChime = () => {
        const now = audioCtx.currentTime;
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

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeStr = `${currentHours}:${currentMinutes}`;
      const dayVal = now.getDay();

      if (timeStr !== lastTriggeredMinute.current) {
        alarms.forEach((alarm) => {
          if (alarm.active && alarm.time === timeStr) {
            const dayMatches = alarm.repeatDays.length === 0 || alarm.repeatDays.includes(dayVal);
            if (dayMatches && !activeAlarmTrigger) {
              lastTriggeredMinute.current = timeStr;
              setActiveAlarmTrigger(alarm);
              playMelodicChimes();

              if (Notification.permission === 'granted') {
                new Notification(`Pro Keep Alarm: ${alarm.label || "Time's Up!"}`, {
                  body: `Your scheduled alarm for ${alarm.time} is ringing!`,
                  icon: '/favicon.ico'
                });
              }
            }
          }
        });
      }

      reminders.forEach((rem) => {
        if (!rem.completed && !rem.notified) {
          const remTime = new Date(rem.datetime);
          if (now >= remTime) {
            setReminders(prev => prev.map(r => r.id === rem.id ? { ...r, notified: true } : r));
            playNotificationChime();

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

  const playNotificationChime = () => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const notes = [523.25, 659.25, 783.99];
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

  const handleDismissAlarm = (alarm) => {
    stopMelodicChimes();
    setActiveAlarmTrigger(null);
    if (alarm.repeatDays.length === 0) {
      setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, active: false } : a));
    }
  };

  const handleSnoozeAlarm = (alarm) => {
    stopMelodicChimes();
    setActiveAlarmTrigger(null);
    const snoozeTime = new Date(Date.now() + alarm.snoozeMinutes * 60 * 1000);
    const snoozeTimeStr = String(snoozeTime.getHours()).padStart(2, '0') + ':' + String(snoozeTime.getMinutes()).padStart(2, '0');

    const snoozedAlarm = {
      id: `snooze-${Date.now()}`,
      time: snoozeTimeStr,
      label: `${alarm.label} (Snoozed)`,
      active: true,
      repeatDays: [],
      snoozeMinutes: alarm.snoozeMinutes
    };

    setAlarms(prev => [...prev, snoozedAlarm]);
  };

  const tabs = [
    { id: 'dashboard', label: 'Control Center', icon: LayoutDashboard },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tasks', label: 'Tasks & Kanban', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'alarms', label: 'Chimes & Alarms', icon: Clock },
  ];

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
    <div className={`prokeep-scope w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#16171d] transition-colors duration-300`}>
      {/* Sub Header for Pro Keep Tab Navigation */}
      <div className="h-14 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-[#16171d]/50 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles size={16} />
          </div>
          <span className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">
            Pro Keep
          </span>
        </div>

        <nav className="flex items-center gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10 scale-105' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="app-container">
          <main className="main-content">
            <header className="view-header">
              <div className="view-title">
                <h1 style={{ textTransform: 'capitalize' }}>
                  {activeTab === 'dashboard' ? 'Control Center' : activeTab === 'tasks' ? 'Task Board' : activeTab}
                </h1>
                <p>
                  {activeTab === 'dashboard'
                    ? 'Your premium productivity scheduler at a glance'
                    : `Manage your personal ${activeTab}`}
                </p>
              </div>
            </header>

            <div className="view-workspace-content">
              {renderActiveView()}
            </div>
          </main>
        </div>
      </div>

      <AlarmOverlay
        activeTrigger={activeAlarmTrigger}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
      />
    </div>
  );
}
