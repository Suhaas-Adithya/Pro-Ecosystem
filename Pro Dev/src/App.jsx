/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * Main Pro Dev ADE (Agentic Development Environment) Application Shell
 */

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import WorkspaceNavigator from './components/WorkspaceNavigator';
import AgentConsole from './components/AgentConsole';
import './App.css';

const SOCKET_URL = 'http://localhost:3001';

export default function App() {
  // File Buffer states
  const [openFiles, setOpenFiles] = useState([]);
  const [activeFilePath, setActiveFilePath] = useState('');
  const [refreshExplorer, setRefreshExplorer] = useState(0);

  // Command compilation process state
  const [compilingCommand, setCompilingCommand] = useState('npm run dev');
  const [compilingLogs, setCompilingLogs] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  // Socket and UI controls refs
  const socketRef = useRef(null);
  const editorRef = useRef(null);

  const activeFile = openFiles.find(f => f.path === activeFilePath);

  // Connect WebSocket for Hot Code Sync and Agent Signals
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('🔗 Connected to Pro Dev WebSocket telemetry broker.');
    });

    socketRef.current.on('fs-change', (data) => {
      // Hot reload open files if changed remotely (e.g., from browser or keeper node)
      setOpenFiles(prev => prev.map(f => {
        if (f.path === data.path) {
          reloadFileContent(f.path);
        }
        return f;
      }));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const reloadFileContent = async (filePath) => {
    try {
      const response = await fetch(`http://localhost:3001/api/fs/read?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      setOpenFiles(prev => prev.map(f => f.path === filePath ? { ...f, content: data.content, isDirty: false } : f));
    } catch (e) {
      console.warn('Auto-reload error:', e.message);
    }
  };

  // Open file in active editor tab
  const handleSelectFile = async (node) => {
    const isAlreadyOpen = openFiles.some(f => f.path === node.path);
    
    if (!isAlreadyOpen) {
      try {
        const response = await fetch(`http://localhost:3001/api/fs/read?path=${encodeURIComponent(node.path)}`);
        const data = await response.json();
        const newFile = {
          name: node.name,
          path: node.path,
          content: data.content || '',
          isDirty: false
        };
        setOpenFiles(prev => [...prev, newFile]);
      } catch (err) {
        alert(`⚠️ Failed to load file: ${err.message}`);
        return;
      }
    }

    setActiveFilePath(node.path);
  };

  // Close active tab
  const handleCloseTab = (path, e) => {
    e.stopPropagation();
    const remaining = openFiles.filter(f => f.path !== path);
    setOpenFiles(remaining);
    
    if (activeFilePath === path) {
      setActiveFilePath(remaining.length > 0 ? remaining[remaining.length - 1].path : '');
    }
  };

  // Edit raw buffer content locally
  const handleEditorChange = (e) => {
    const val = e.target.value;
    setOpenFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, content: val, isDirty: true } : f));
  };

  // Save active file changes to disk physically
  const handleSaveActiveFile = async () => {
    if (!activeFile) return;

    try {
      const response = await fetch('http://localhost:3001/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeFile.path,
          content: activeFile.content
        })
      });

      if (!response.ok) throw new Error('REST server responded with error');
      
      setOpenFiles(prev => prev.map(f => f.path === activeFilePath ? { ...f, isDirty: false } : f));
      setRefreshExplorer(prev => prev + 1);
      
      // Send Hot Module Sync signal
      socketRef.current?.emit('gemma-file-change', { path: activeFile.path });
      console.log(`[ADE Save] Sync code written to: ${activeFile.name}`);
    } catch (err) {
      alert(`⚠️ Failed to save file physically: ${err.message}`);
    }
  };

  // Agent diff approval callback updates
  const handleAgentFileSaved = (filePath, content) => {
    setOpenFiles(prev => prev.map(f => f.path === filePath ? { ...f, content, isDirty: false } : f));
    setRefreshExplorer(prev => prev + 1);
  };

  // Execute terminal build scripts
  const handleRunCommand = async (e) => {
    e.preventDefault();
    if (!compilingCommand.trim()) return;

    setIsCompiling(true);
    setCompilingLogs(`$ Running: ${compilingCommand.trim()}\n`);

    try {
      const response = await fetch('http://localhost:3001/api/fs/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: compilingCommand.trim() })
      });
      const data = await response.json();
      
      let logs = '';
      if (data.stdout) logs += data.stdout;
      if (data.stderr) logs += `\nError logs:\n${data.stderr}`;
      if (data.error) logs += `\nProcess error: ${data.error}`;
      
      setCompilingLogs(prev => prev + logs + `\n$ Process terminated with status: ${data.success ? 'Success' : 'Fail'}\n`);
    } catch (err) {
      setCompilingLogs(prev => prev + `\nExecution error: ${err.message}\n`);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="pro-dev-ade-app">
      {/* ─── TOP ADE MENU BAR ─── */}
      <div className="ade-top-menubar">
        <div className="brand-title">
          <span className="logo-glow">✦</span> Pro Dev ADE <span className="pncpl-badge">PNCPL-1.0</span>
        </div>
        <div className="menu-shortcuts">
          <button className="menu-btn" onClick={() => setRefreshExplorer(p => p + 1)}>⟳ Refresh Tree</button>
          {activeFile && (
            <button className={`menu-btn save ${activeFile.isDirty ? 'dirty' : ''}`} onClick={handleSaveActiveFile}>
              💾 Save Buffer {activeFile.isDirty ? '●' : ''}
            </button>
          )}
        </div>
      </div>

      {/* ─── MAIN TRIPLE-GRID INTERFACE ─── */}
      <div className="ade-workspace-grid">
        
        {/* Left Column: Recursive Workspace explorer */}
        <div className="grid-left-col">
          <WorkspaceNavigator
            onSelectFile={handleSelectFile}
            selectedFilePath={activeFilePath}
            refreshTrigger={refreshExplorer}
          />
        </div>

        {/* Center Column: Visual editor tabs & workspace buffers */}
        <div className="grid-center-col">
          {/* Tab Buffers strip */}
          <div className="editor-tab-strip">
            {openFiles.map(file => {
              const isActive = file.path === activeFilePath;
              return (
                <div
                  key={file.path}
                  className={`editor-tab ${isActive ? 'active' : ''} ${file.isDirty ? 'dirty' : ''}`}
                  onClick={() => setActiveFilePath(file.path)}
                >
                  <span className="tab-icon">📄</span>
                  <span className="tab-name">{file.name}</span>
                  <button className="tab-close-x" onClick={(e) => handleCloseTab(file.path, e)}>×</button>
                </div>
              );
            })}
            {openFiles.length === 0 && (
              <div className="no-tabs-label">No active file buffers loaded.</div>
            )}
          </div>

          {/* Active editor frame */}
          <div className="editor-content-viewport">
            {activeFile ? (
              <div className="editor-textarea-container">
                <textarea
                  ref={editorRef}
                  value={activeFile.content}
                  onChange={handleEditorChange}
                  className="editor-textarea code-bg"
                  spellCheck="false"
                />
                <div className="editor-footer-status">
                  <span>UTF-8</span>
                  <span>Lines: {activeFile.content.split('\n').length}</span>
                  <span>Path: {activeFile.path}</span>
                </div>
              </div>
            ) : (
              <div className="empty-workspace-jumbotron">
                <div className="jumbotron-sparkle">✦</div>
                <h3>Welcome to Pro Agentic Workspace</h3>
                <p>Select any code file from the left Workspace Explorer tree, or spawn refactoring loops directly in the right Gemma 4 Copilot.</p>
                <div className="jumbotron-shortcuts">
                  <div className="shortcut-item"><span>1. Click File</span> <span>Load editor buffer</span></div>
                  <div className="shortcut-item"><span>2. Write Prompt</span> <span>Autopilot thought diffs</span></div>
                  <div className="shortcut-item"><span>3. Approve Diff</span> <span>Physical save & eslint chimes</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Integrated terminal runners */}
          <div className="integrated-compiler-runner">
            <div className="compiler-controls">
              <span className="runner-lbl">TERMINAL RUNNER:</span>
              <form onSubmit={handleRunCommand} className="compiler-form">
                <input
                  type="text"
                  value={compilingCommand}
                  onChange={(e) => setCompilingCommand(e.target.value)}
                  placeholder="npm test | npm run build | eslint..."
                  className="input-field command-input"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={isCompiling}>
                  {isCompiling ? 'Running Process...' : 'Run Shell ✦'}
                </button>
              </form>
            </div>
            <div className="compiler-console-logs code-bg">
              <pre>{compilingLogs || '$ Terminal idle. Enter command scripts to run compiles.'}</pre>
            </div>
          </div>
        </div>

        {/* Right Column: Gemma 4 AI autopilot consoles */}
        <div className="grid-right-col">
          <AgentConsole
            socket={socketRef.current}
            activeFile={activeFile}
            onFileSaved={handleAgentFileSaved}
          />
        </div>

      </div>
    </div>
  );
}
