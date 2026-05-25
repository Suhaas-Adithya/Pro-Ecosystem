/**
 * @license PNCPL-1.0
 * Pro Suite Non-Commercial Public License v1.0
 * Copyright (c) 2026 Pro Suite Open Source Project. All rights reserved.
 * 
 * Interactive Workspace Explorer Tree Component
 */

import React, { useState, useEffect } from 'react';

export default function WorkspaceNavigator({ onSelectFile, selectedFilePath, refreshTrigger }) {
  const [explorerData, setExplorerData] = useState(null);
  const [expandedDirs, setExpandedDirs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkspaceTree();
  }, [refreshTrigger]);

  const fetchWorkspaceTree = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fs/list');
      const data = await response.json();
      setExplorerData(data);
      
      // Auto-expand the top-level directories by default
      if (data.files) {
        const topDirs = {};
        data.files.forEach(f => {
          if (f.isDir) topDirs[f.path] = true;
        });
        setExpandedDirs(prev => ({ ...topDirs, ...prev }));
      }
    } catch (err) {
      console.error('[FS List] Fail loading workspace tree:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDir = (path) => {
    setExpandedDirs(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Helper to check if node or any of its children match search term
  const filterNode = (node) => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    if (node.name.toLowerCase().includes(term)) return true;
    
    if (node.isDir && node.children) {
      return node.children.some(child => filterNode(child));
    }
    
    return false;
  };

  // recursive rendering helper
  const renderNode = (node) => {
    if (!filterNode(node)) return null;

    if (node.isDir) {
      const isExpanded = !!expandedDirs[node.path];
      return (
        <div key={node.path} className="tree-dir-node">
          <div
            className={`tree-node-row dir-row ${isExpanded ? 'expanded' : ''}`}
            onClick={() => toggleDir(node.path)}
          >
            <span className="tree-arrow">{isExpanded ? '▼' : '▶'}</span>
            <span className="tree-icon">📁</span>
            <span className="tree-node-name font-semibold">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div className="tree-dir-children">
              {node.children.map(child => renderNode(child))}
            </div>
          )}
        </div>
      );
    } else {
      const isSelected = selectedFilePath === node.path;
      const sizeStr = node.size ? `${(node.size / 1024).toFixed(1)} KB` : '0 KB';
      return (
        <div
          key={node.path}
          className={`tree-node-row file-row ${isSelected ? 'active' : ''}`}
          onClick={() => onSelectFile(node)}
        >
          <span className="tree-icon">📄</span>
          <span className="tree-node-name">{node.name}</span>
          <span className="file-size-badge">{sizeStr}</span>
        </div>
      );
    }
  };

  return (
    <div className="workspace-explorer-panel">
      <div className="explorer-header-actions">
        <h3 className="panel-title">WORKSPACE EXPLORER</h3>
        <button className="refresh-explorer-btn" onClick={fetchWorkspaceTree} disabled={loading}>
          {loading ? '↻' : '⟳'}
        </button>
      </div>

      <div className="search-filter-row">
        <input
          type="text"
          placeholder="Filter workspace files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field explorer-search"
        />
      </div>

      <div className="explorer-tree-view">
        {loading && !explorerData && (
          <div className="tree-loader">Scanning workspace paths...</div>
        )}
        
        {explorerData && explorerData.files ? (
          <div className="tree-root-container">
            <div className="root-label">
              <span>🗄️</span> <strong>{explorerData.root.split(/\/|\\/).pop() || 'Project Pro'}</strong>
            </div>
            <div className="tree-dir-children">
              {explorerData.files.map(node => renderNode(node))}
            </div>
          </div>
        ) : (
          !loading && <div className="no-items-text">No workspace directories mapped.</div>
        )}
      </div>

      <style>{`
        .workspace-explorer-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          border-right: 1px solid var(--glass-border);
          background: rgba(0, 0, 0, 0.15);
        }

        .explorer-header-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .panel-title {
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--accent-color);
        }

        .refresh-explorer-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.2rem;
          cursor: pointer;
          transition: color var(--transition-speed);
        }
        .refresh-explorer-btn:hover {
          color: var(--accent-color);
        }

        .search-filter-row {
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid var(--glass-border);
        }
        .explorer-search {
          width: 100%;
          font-size: 0.8rem;
          padding: 0.4rem 0.6rem;
        }

        .explorer-tree-view {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.25rem;
          font-family: var(--sans-font);
          font-size: 0.82rem;
        }

        .tree-loader {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem 0;
          font-style: italic;
        }

        .tree-root-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .root-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0;
          color: var(--text-primary);
        }

        .tree-node-row {
          display: flex;
          align-items: center;
          padding: 0.35rem 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all var(--transition-speed);
          user-select: none;
          gap: 0.4rem;
        }

        .dir-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .file-row {
          color: var(--text-secondary);
          margin-left: 0.75rem;
        }
        .file-row:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #ffffff;
        }
        .file-row.active {
          background: var(--accent-glow);
          color: var(--accent-color);
          font-weight: 600;
          border-left: 2px solid var(--accent-color);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .tree-arrow {
          font-size: 0.6rem;
          color: var(--text-muted);
          width: 12px;
        }
        .tree-icon {
          font-size: 0.9rem;
        }

        .tree-node-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tree-dir-children {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding-left: 1rem;
          border-left: 1px dashed rgba(255, 255, 255, 0.03);
          margin-left: 0.5rem;
        }

        .file-size-badge {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: var(--mono-font);
          background: rgba(255, 255, 255, 0.02);
          padding: 0.1rem 0.35rem;
          border-radius: 4px;
          margin-left: auto;
        }
        .file-row.active .file-size-badge {
          background: rgba(139, 92, 246, 0.1);
          color: var(--accent-color);
        }
      `}</style>
    </div>
  );
}
