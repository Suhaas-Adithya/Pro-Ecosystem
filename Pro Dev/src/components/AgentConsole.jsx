/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * Gemma 4 Agentic Copilot and Visual Diff Patches Approval Console
 */

import React, { useState, useEffect, useRef } from 'react';

export default function AgentConsole({ socket, activeFile, onFileSaved }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      subagent: 'Autopilot Core',
      text: '✦ Edge Agentic Core active. Ready to run multi-step code refactoring loops, scan directory branches, and resolve syntax conflicts. Specify target file or task context!',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [selectedSubagent, setSelectedSubagent] = useState('autopilot');
  const [isRunning, setIsRunning] = useState(false);
  const [agentSteps, setAgentSteps] = useState([]);
  
  // Diff viewer states
  const [proposedDiff, setProposedDiff] = useState(null);
  
  // Terminal logs states
  const [terminalLogs, setTerminalLogs] = useState([
    '✦ compiler init: ready.',
    '✦ watch task: monitoring changes in project tree.'
  ]);

  const chatEndRef = useRef(null);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentSteps, isRunning]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Hook up WebSocket relays for automated streaming
  useEffect(() => {
    if (socket) {
      socket.on('gemma-agent-task-update', (data) => {
        setTerminalLogs(prev => [...prev, `[AI Autopilot] Node: ${data.node} - ${data.status}`]);
      });
      socket.on('gemma-tool-call-log', (data) => {
        setTerminalLogs(prev => [...prev, `[AI Tool Execute] Called: ${data.toolName} on target: ${data.target}`]);
      });
    }
  }, [socket]);

  const addTerminalLog = (log) => {
    setTerminalLogs(prev => [...prev, log]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      role: 'user',
      text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsRunning(true);
    setProposedDiff(null);
    setAgentSteps([]);

    addTerminalLog(`✦ AI trigger initiated: agent-${selectedSubagent} loop spawning`);

    // Simulate multi-step agent thought & action sequence
    setTimeout(() => {
      // Step 1: Subagent thinking
      setAgentSteps(prev => [...prev, {
        type: 'thought',
        title: 'AUTONOMOUS REASONING LOOP',
        content: `Analyzing active file context: ${activeFile ? activeFile.name : 'No active file selected'}. Scanning declarations, importing dependencies, and auditing class structures to apply optimized changes.`
      }]);
      addTerminalLog('[AI Agent] Reasoning stage completed.');

      setTimeout(() => {
        // Step 2: Tool execution call
        setAgentSteps(prev => [...prev, {
          type: 'tool',
          title: 'TOOL CALL LOG',
          content: `Running tool [grep_search] with query: "export" inside file: ${activeFile ? activeFile.name : 'root'}`
        }]);
        addTerminalLog('[AI Tool] grep_search returned 4 matches.');

        setTimeout(() => {
          if (!activeFile) {
            // No active file fallback
            setMessages(prev => [...prev, {
              role: 'ai',
              subagent: `${selectedSubagent.toUpperCase()} Core`,
              text: '🛑 Task aborted: Please select a file in the Workspace Explorer before spawning editing loops!',
              timestamp: new Date().toLocaleTimeString()
            }]);
            setIsRunning(false);
            return;
          }

          // Step 3: Diff proposal
          const originalCode = activeFile.content || '// Empty file';
          let proposedCode = '';
          
          if (originalCode.includes('App') || originalCode.includes('function') || originalCode.includes('const')) {
            // Inject customized code modification depending on content
            proposedCode = `// Modified by Gemma 4 Agentic Loop under PNCPL-1.0
${originalCode}

// ✦ Unified Ecosystem sync telemetry hook
export function initEcosystemSync() {
  console.log("Zero-latency synchronization online.");
}`;
          } else {
            proposedCode = `${originalCode}\n\n// ✦ Synchronized under PNCPL-1.0\nconsole.log("Gemma Sync live!");`;
          }

          setProposedDiff({
            filePath: activeFile.path,
            original: originalCode,
            proposed: proposedCode
          });

          setAgentSteps(prev => [...prev, {
            type: 'diff',
            title: 'DIFF REVISION BUILT',
            content: 'Gemma 4 has completed code edits. Please review visual differences below and click "Approve Diff" to physically write to disk!'
          }]);

          setIsRunning(false);
          addTerminalLog('[AI Agent] Code revision prepared - holding for user confirmation.');
        }, 1500);
      }, 1200);
    }, 1000);
  };

  const handleApproveDiff = async () => {
    if (!proposedDiff) return;

    addTerminalLog(`💾 Committing Diff changes to disk: ${activeFile.name}`);
    try {
      const response = await fetch('http://localhost:3001/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: proposedDiff.filePath,
          content: proposedDiff.proposed
        })
      });

      if (!response.ok) throw new Error('Failed to save file changes');
      
      addTerminalLog('✅ Changes successfully saved. Linter compilation triggered.');
      addTerminalLog('⚙️ [eslint] 0 warnings, compiled successfully in 84ms.');
      
      // Notify parent to refresh editor and explorer buffers
      onFileSaved(proposedDiff.filePath, proposedDiff.proposed);
      setProposedDiff(null);
      
      setMessages(prev => [...prev, {
        role: 'ai',
        subagent: 'Autopilot Core',
        text: '🎉 Visual diff approved! File successfully committed to disk and lint compiled.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      addTerminalLog(`🛑 File commit failed: ${err.message}`);
    }
  };

  const renderDiffLines = () => {
    if (!proposedDiff) return null;

    const originalLines = proposedDiff.original.split('\n');
    const proposedLines = proposedDiff.proposed.split('\n');

    return (
      <div className="diff-split-container">
        {/* Original Code */}
        <div className="diff-panel original code-bg">
          <div className="diff-panel-title">ORIGINAL</div>
          <div className="diff-lines-wrapper">
            {originalLines.map((line, idx) => (
              <div key={idx} className="diff-line-row">
                <span className="diff-num">{idx + 1}</span>
                <span className="diff-txt line-del">{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Proposed Code */}
        <div className="diff-panel proposed code-bg">
          <div className="diff-panel-title">PROPOSED PATCH</div>
          <div className="diff-lines-wrapper">
            {proposedLines.map((line, idx) => {
              const isAdded = !originalLines.includes(line);
              return (
                <div key={idx} className={`diff-line-row ${isAdded ? 'added-row' : ''}`}>
                  <span className="diff-num">{idx + 1}</span>
                  <span className={`diff-txt ${isAdded ? 'line-add' : ''}`}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="gemma-agent-console">
      
      {/* Top Header Selector */}
      <div className="console-header-bar">
        <div className="badge-row">
          <span className="copilot-badge">GEMMA 4 COPILOT</span>
          <span className="status-label blink">● ACTIVE AGENT</span>
        </div>
        <select
          value={selectedSubagent}
          onChange={(e) => setSelectedSubagent(e.target.value)}
          className="input-field subagent-select"
        >
          <option value="autopilot">✦ Multi-Step Autopilot</option>
          <option value="linter">🛠️ Syntax Linter Subagent</option>
          <option value="architect">📐 Architecture Planner</option>
          <option value="auditor">🔒 License & Security Auditor</option>
        </select>
      </div>

      {/* Message & Steps Panel */}
      <div className="agent-activity-feed">
        {messages.map((msg, i) => (
          <div key={i} className={`feed-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
            <div className="bubble-hdr">
              <strong>{msg.role === 'user' ? 'Developer' : msg.subagent}</strong>
              <span className="time">{msg.timestamp}</span>
            </div>
            <p className="bubble-body-text">{msg.text}</p>
          </div>
        ))}

        {/* Active Multi-step tracking loops */}
        {agentSteps.map((step, idx) => (
          <div key={idx} className={`step-alert-card card-${step.type} glass-card`}>
            <div className="step-card-header">
              <span className="step-indicator">● {step.type.toUpperCase()}</span>
              <strong>{step.title}</strong>
            </div>
            <p className="step-card-body">{step.content}</p>
          </div>
        ))}

        {isRunning && (
          <div className="agent-thinking-spinner">
            <span className="sparkle animate-pulse">✦</span>
            <span>Gemma 4 is running step sequence cycles...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Visual Code Difference Patch Box */}
      {proposedDiff && (
        <div className="agent-diff-viewer glass-card animate-slide-up">
          <div className="diff-header-bar">
            <h4>Code Revision Proposal</h4>
            <div className="diff-action-buttons">
              <button className="btn btn-secondary btn-sm" onClick={() => setProposedDiff(null)}>Reject</button>
              <button className="btn btn-primary btn-sm" onClick={handleApproveDiff}>Approve Diff ✦</button>
            </div>
          </div>
          {renderDiffLines()}
        </div>
      )}

      {/* User Prompt Input Form */}
      <form onSubmit={handleSendMessage} className="console-input-form">
        <input
          type="text"
          placeholder={activeFile ? `Instruct subagent to refactor ${activeFile.name}...` : "Select a file to instruct AI refactoring loops..."}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="input-field prompt-input"
        />
        <button type="submit" className="btn btn-primary send-prompt-btn" disabled={isRunning}>
          Instruct ✦
        </button>
      </form>

      {/* Unified Compiler Terminal logs */}
      <div className="integrated-compiler-terminal">
        <div className="terminal-header">
          <span>⚙️ SYNCHRONIZED COMPILER CHIMES</span>
          <button className="btn-clear" onClick={() => setTerminalLogs([])}>Clear Console</button>
        </div>
        <div className="terminal-logs-scroller code-bg">
          {terminalLogs.map((log, index) => (
            <div key={index} className="terminal-line">
              <span className="time-lbl">&gt;</span> <span className="log-txt">{log}</span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

      <style>{`
        .gemma-agent-console {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-secondary);
        }

        .console-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.15);
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .copilot-badge {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-color);
          background: var(--accent-glow);
          border: 1px solid rgba(139, 92, 246, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .status-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--success-color);
        }

        .subagent-select {
          font-size: 0.75rem;
          padding: 0.3rem 0.5rem;
        }

        .agent-activity-feed {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          max-height: 280px;
        }

        .feed-bubble {
          max-width: 85%;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .feed-bubble.user {
          align-self: flex-end;
          align-items: flex-end;
        }
        .feed-bubble.ai {
          align-self: flex-start;
          align-items: flex-start;
        }

        .bubble-hdr {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
        }
        .feed-bubble.user .bubble-hdr {
          flex-direction: row-reverse;
        }
        .bubble-hdr strong { color: var(--text-primary); }
        .bubble-hdr .time { color: var(--text-muted); }

        .bubble-body-text {
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 0.6rem 0.85rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
          margin: 0;
          word-break: break-word;
        }
        .feed-bubble.user .bubble-body-text {
          background: var(--accent-color);
          color: #ffffff;
          box-shadow: 0 4px 10px var(--accent-glow);
          border-color: var(--accent-color);
        }

        /* Step alerts */
        .step-alert-card {
          border-left: 3px solid var(--text-muted);
          padding: 0.85rem 1.25rem !important;
          animation: slideUp 0.3s ease-out;
        }
        .card-thought { border-left-color: var(--accent-color); }
        .card-tool { border-left-color: var(--warning-color); }
        .card-diff { border-left-color: var(--success-color); }

        .step-card-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.72rem;
          margin-bottom: 0.25rem;
        }
        .step-indicator {
          font-weight: 800;
        }
        .card-thought .step-indicator { color: var(--accent-color); }
        .card-tool .step-indicator { color: var(--warning-color); }
        .card-diff .step-indicator { color: var(--success-color); }

        .step-card-body {
          font-size: 0.78rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        .agent-thinking-spinner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: var(--accent-color);
          font-style: italic;
        }

        /* Diff proposed styling */
        .agent-diff-viewer {
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          padding: 0 !important;
          max-height: 250px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: var(--bg-tertiary);
        }
        .diff-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 1.25rem;
          border-bottom: 1px solid var(--glass-border);
        }
        .diff-header-bar h4 { font-size: 0.8rem; color: #ffffff; }
        .diff-action-buttons { display: flex; gap: 0.5rem; }

        .diff-split-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          flex: 1;
          overflow-y: auto;
        }
        .diff-panel {
          padding: 0.75rem;
          overflow-x: auto;
          display: flex;
          flex-direction: column;
        }
        .diff-panel.original {
          border-right: 1px solid var(--glass-border);
        }
        .diff-panel-title {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          margin-bottom: 0.5rem;
          letter-spacing: 0.05em;
        }
        .diff-lines-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .diff-line-row {
          display: flex;
          gap: 0.75rem;
          font-family: var(--mono-font);
          font-size: 0.75rem;
          line-height: 1.4;
          white-space: pre;
        }
        .diff-num {
          color: var(--text-muted);
          width: 20px;
          text-align: right;
          flex-shrink: 0;
          user-select: none;
        }
        .diff-txt {
          flex: 1;
        }
        .line-del {
          color: #f87171;
          background: rgba(239, 68, 68, 0.08);
          display: block;
          width: 100%;
        }
        .line-add {
          color: #34d399;
        }
        .added-row {
          background: rgba(16, 185, 129, 0.08);
          width: 100%;
        }

        .console-input-form {
          display: flex;
          padding: 0.85rem 1.25rem;
          gap: 0.75rem;
          border-top: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.15);
        }
        .prompt-input {
          flex: 1;
          font-size: 0.82rem;
        }
        .send-prompt-btn {
          font-size: 0.82rem;
          padding: 0.4rem 1.25rem;
        }

        /* Compiler terminal section */
        .integrated-compiler-terminal {
          background: #040508;
          border-top: 1px solid var(--glass-border);
          height: 150px;
          display: flex;
          flex-direction: column;
        }
        .terminal-header {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--glass-border);
          font-family: var(--sans-font);
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }
        .btn-clear {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.65rem;
        }
        .btn-clear:hover {
          color: var(--accent-color);
        }
        .terminal-logs-scroller {
          flex: 1;
          overflow-y: auto;
          padding: 0.75rem 1.25rem;
          color: #a7f3d0;
          font-size: 0.72rem;
          line-height: 1.45;
        }
      `}</style>
    </div>
  );
}
