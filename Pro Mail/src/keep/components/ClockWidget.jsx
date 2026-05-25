import React, { useState, useEffect } from 'react';

export default function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 100); // 100ms for smooth updating
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();

  // Smooth angles
  const secondAngle = ((seconds + milliseconds / 1000) * 360) / 60;
  const minuteAngle = ((minutes + seconds / 60) * 360) / 60;
  const hourAngle = (((hours % 12) + minutes / 60) * 360) / 12;

  // Digital Formatting
  const digitalTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const digitalDate = time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="clock-widget-container glass-card">
      <div className="analog-clock-wrapper">
        <svg viewBox="0 0 200 200" className="analog-clock">
          {/* Clock Face Circle */}
          <circle cx="100" cy="100" r="95" className="clock-rim" />
          <circle cx="100" cy="100" r="90" className="clock-face" />

          {/* Hour Markings */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 100 + 78 * Math.sin(angle);
            const y1 = 100 - 78 * Math.cos(angle);
            const x2 = 100 + 85 * Math.sin(angle);
            const y2 = 100 - 85 * Math.cos(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                className={i % 3 === 0 ? 'clock-tick major' : 'clock-tick'}
              />
            );
          })}

          {/* Glowing Hands */}
          {/* Hour Hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 50 * Math.sin((hourAngle * Math.PI) / 180)}
            y2={100 - 50 * Math.cos((hourAngle * Math.PI) / 180)}
            className="clock-hand hour"
          />

          {/* Minute Hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 70 * Math.sin((minuteAngle * Math.PI) / 180)}
            y2={100 - 70 * Math.cos((minuteAngle * Math.PI) / 180)}
            className="clock-hand minute"
          />

          {/* Second Hand */}
          <line
            x1="100"
            y1="100"
            x2={100 + 80 * Math.sin((secondAngle * Math.PI) / 180)}
            y2={100 - 80 * Math.cos((secondAngle * Math.PI) / 180)}
            className="clock-hand second"
          />

          {/* Center Peg */}
          <circle cx="100" cy="100" r="4" className="clock-center" />
          <circle cx="100" cy="100" r="1.5" className="clock-center-inner" />
        </svg>
      </div>

      <div className="digital-clock-wrapper">
        <h1 className="digital-time">{digitalTime}</h1>
        <p className="digital-date">{digitalDate}</p>
      </div>

      <style>{`
        .clock-widget-container {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          max-width: 550px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--glass-bg), hsla(var(--hue), 20%, 100%, 0.02));
        }

        @media (max-width: 600px) {
          .clock-widget-container {
            flex-direction: column;
            text-align: center;
            gap: 1.5rem;
          }
        }

        .analog-clock-wrapper {
          width: 140px;
          height: 140px;
          flex-shrink: 0;
        }

        .analog-clock {
          width: 100%;
          height: 100%;
        }

        .clock-rim {
          fill: none;
          stroke: var(--glass-border);
          stroke-width: 2;
        }

        .clock-face {
          fill: hsla(var(--hue), 24%, 6%, 0.3);
        }

        .clock-tick {
          stroke: var(--text-muted);
          stroke-width: 1;
        }

        .clock-tick.major {
          stroke: var(--text-secondary);
          stroke-width: 2;
        }

        .clock-hand {
          stroke-linecap: round;
        }

        .clock-hand.hour {
          stroke: var(--text-primary);
          stroke-width: 4.5;
          filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.2));
        }

        .clock-hand.minute {
          stroke: var(--accent-color);
          stroke-width: 3;
          filter: drop-shadow(0 0 6px var(--accent-glow));
        }

        .clock-hand.second {
          stroke: var(--danger-color);
          stroke-width: 1.25;
          filter: drop-shadow(0 0 5px hsla(350, 80%, 55%, 0.4));
        }

        .clock-center {
          fill: var(--accent-color);
        }

        .clock-center-inner {
          fill: #fff;
        }

        .digital-clock-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .digital-time {
          font-family: 'Outfit', sans-serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          text-shadow: 0 0 10px var(--accent-glow);
        }

        .digital-date {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
