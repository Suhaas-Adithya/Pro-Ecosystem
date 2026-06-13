import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [history, setHistory] = useState([
    { type: 'system', text: 'PRO TERMINAL v1.0.0 (TETHERED)' },
    { type: 'system', text: 'Establishing secure link to Ecosystem Mesh...' },
    { type: 'success', text: 'LINK ESTABLISHED. AWAITING COMMAND.' }
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'input', text: `> ${cmd}` }]);
    setInput('');

    // Command Parser
    const args = cmd.split(' ');
    const root = args[0].toLowerCase();

    let response = '';
    
    switch(root) {
      case 'help':
        response = `AVAILABLE COMMANDS:\n  ping [target] - Test mesh latency\n  status - View ecosystem telemetry\n  boot [app] - Launch ecosystem app\n  clear - Clear terminal`;
        break;
      case 'clear':
        setHistory([]);
        return;
      case 'ping':
        response = `Pinging ${args[1] || 'localhost'}...\nReply from ${args[1] || 'localhost'}: time=2ms TTL=64`;
        break;
      case 'status':
        try {
          const res = await fetch('http://localhost:3001/api/vault');
          const data = await res.json();
          response = `[MESH STATUS: ONLINE]\nVault Files: ${data.files?.length || 0}\nConnected Nodes: 11`;
        } catch (e) {
          response = '[ERROR] Cannot connect to Universal Backend.';
        }
        break;
      case 'boot':
        const appToBoot = args[1];
        if (appToBoot) {
          window.parent.postMessage({ type: 'OS_LAUNCH_APP', appId: appToBoot.toLowerCase() }, '*');
          response = `Boot sequence initiated for: ${appToBoot}`;
        } else {
          response = 'Error: Target application not specified. Usage: boot [app]';
        }
        break;
      default:
        response = `Command not recognized: ${root}. Type 'help' for available commands.`;
    }

    setTimeout(() => {
      setHistory(prev => [...prev, { type: 'output', text: response }]);
    }, 400);
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span>root@pro.eco:~</span>
      </div>
      <div className="terminal-body" onClick={() => document.getElementById('cmd-input').focus()}>
        {history.map((line, idx) => (
          <div key={idx} className={`log-line ${line.type}`} style={{ whiteSpace: 'pre-wrap' }}>
            {line.text}
          </div>
        ))}
        <form onSubmit={handleCommand} className="input-line">
          <span className="prompt">{'>'}</span>
          <input
            id="cmd-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  );
}

export default App;
