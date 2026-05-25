import React, { useEffect, useState } from 'react';
import { AlarmsIcon } from './Icons';

export default function AlarmOverlay({ activeTrigger, onDismiss, onSnooze }) {
  const [digitalTime, setDigitalTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDigitalTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!activeTrigger) return null;

  return (
    <div className="alarm-trigger-overlay">
      <div className="alarm-trigger-container glass-card">
        <div className="trigger-icon-pulse">
          <div className="pulse-ring r1" />
          <div className="pulse-ring r2" />
          <div className="pulse-ring r3" />
          <div className="ringing-bell-wrapper">
            <AlarmsIcon size={64} className="ringing-bell alarm-bell-glow" />
          </div>
        </div>

        <div className="trigger-time-display">
          <h1>{digitalTime}</h1>
          <h2>{activeTrigger.label || 'Alarm Ringing'}</h2>
        </div>

        <div className="trigger-actions">
          <button className="btn btn-secondary btn-lg snooze" onClick={() => onSnooze(activeTrigger)}>
            Snooze ({activeTrigger.snoozeMinutes}m)
          </button>
          <button className="btn btn-danger btn-lg dismiss" onClick={() => onDismiss(activeTrigger)}>
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        .alarm-trigger-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 5, 10, 0.95);
          backdrop-filter: blur(20px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: overlay-fade-in 0.5s ease-out;
        }

        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .alarm-trigger-container {
          width: 100%;
          max-width: 480px;
          text-align: center;
          padding: 3rem 2rem;
          background: rgba(20, 22, 35, 0.7);
          border: 1px solid rgba(250, 180, 50, 0.25);
          box-shadow: 0 0 50px rgba(250, 180, 50, 0.15);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
        }

        /* Pulsing Rings under Ringing Bell */
        .trigger-icon-pulse {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ringing-bell-wrapper {
          position: relative;
          z-index: 10;
          background: var(--bg-secondary);
          width: 90px;
          height: 90px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--warning-color);
          box-shadow: 0 0 20px var(--warning-color);
        }

        .alarm-bell-glow {
          color: var(--warning-color);
          filter: drop-shadow(0 0 10px var(--warning-color));
        }

        .pulse-ring {
          position: absolute;
          border: 2px solid var(--warning-color);
          border-radius: 50%;
          opacity: 0;
          animation: ring-pulse-grow 3s cubic-bezier(0.25, 0, 0, 1) infinite;
        }

        .pulse-ring.r1 { animation-delay: 0s; }
        .pulse-ring.r2 { animation-delay: 1s; }
        .pulse-ring.r3 { animation-delay: 2s; }

        @keyframes ring-pulse-grow {
          0% {
            width: 80px;
            height: 80px;
            opacity: 0.8;
          }
          100% {
            width: 220px;
            height: 220px;
            opacity: 0;
          }
        }

        .trigger-time-display h1 {
          font-size: 3.5rem;
          font-family: 'Outfit', sans-serif;
          color: #fff;
          letter-spacing: -0.02em;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
        }

        .trigger-time-display h2 {
          font-size: 1.5rem;
          color: var(--warning-color);
          margin-top: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .trigger-actions {
          display: flex;
          gap: 1.5rem;
          width: 100%;
        }

        .btn-lg {
          flex: 1;
          padding: 1rem 1.5rem;
          font-size: 1.1rem;
          border-radius: 12px;
        }

        .btn-secondary.snooze {
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .btn-secondary.snooze:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .btn-danger.dismiss {
          animation: shake-action-btn 0.5s ease-in-out infinite;
        }

        @keyframes shake-action-btn {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
