import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchSSO = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/profile?uid=global_device');
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (err) {
        console.warn('SSO sync failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSSO();
  }, []);

  const loadFileSystem = () => {
    fetch('http://localhost:3001/api/fs/list')
      .then(res => res.json())
      .then(data => {
        if (data && data.files) {
          setFiles(data.files);
        }
      })
      .catch(err => console.error("FS fetch error:", err));
  };

  useEffect(() => {
    if (profile) loadFileSystem();
  }, [profile]);

  const getCurrentNodes = () => {
    if (currentPath === '/') return files;
    const parts = currentPath.split('/').filter(Boolean);
    let currentNodes = files;
    for (const part of parts) {
      const folder = currentNodes.find(n => n.isDir && n.name === part);
      if (folder) {
        currentNodes = folder.children || [];
      } else {
        return [];
      }
    }
    return currentNodes;
  };

  const handleNodeClick = (node) => {
    if (node.isDir) {
      setCurrentPath(prev => prev === '/' ? `/${node.name}` : `${prev}/${node.name}`);
    } else {
      window.parent.postMessage({ type: 'navigate', url: `pro://docs?file=${encodeURIComponent(node.path)}` }, '*');
    }
  };

  const navigateUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length ? `/${parts.join('/')}` : '/');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Resolve current absolute path
    // root is `e:\Projects\Project Pro` implicitly on backend.
    // So we just pass the relative path part and backend appends it.
    // Actually, backend needs absolute path. Let's get root from the first fetch.
    const rootPath = "e:\\Projects\\Project Pro"; // Hardcoded for simplicity or we can get from list
    const targetPath = currentPath === '/' ? rootPath : `${rootPath}${currentPath.replace(/\\/g, '\\')}`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', targetPath);

    try {
      const response = await fetch('http://localhost:3001/api/fs/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        loadFileSystem(); // Refresh
      }
    } catch (err) {
      alert("Upload failed.");
    }
  };

  if (loading) return <div style={{ color: 'white', padding: 20 }}>Loading Pro Drive...</div>;
  if (!profile) return <div style={{ color: 'white', padding: 20 }}>Please sign into Pro Suite ecosystem via Pro Browser.</div>;

  const currentNodes = getCurrentNodes();

  return (
    <div className="drive-app">
      <div className="sidebar">
        <div className="sidebar-header">☁️ Pro Drive</div>
        <div className="nav-links">
          <div className="nav-item active">📁 My Files</div>
          <div className="nav-item">👥 Shared with me</div>
          <div className="nav-item">⏱️ Recent</div>
          <div className="nav-item">⭐ Starred</div>
          <div className="nav-item">🗑️ Trash</div>
        </div>
        <div className="storage-meter">
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Storage (45% used)</div>
          <div className="meter-bar">
            <div className="meter-fill"></div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>45 GB of 100 GB used</div>
        </div>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="breadcrumbs">
            {currentPath !== '/' && (
              <span onClick={navigateUp} style={{ marginRight: '10px', cursor: 'pointer' }}>⬅️</span>
            )}
            Pro Drive {currentPath.replace(/\//g, ' / ')}
          </div>
          <div className="search-bar" style={{ display: 'flex', gap: '10px' }}>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current.click()} style={{ padding: '4px 12px', background: 'var(--accent-color)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
              + Upload File
            </button>
            <input type="text" placeholder="Search in Drive..." style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px' }} />
          </div>
        </div>

        <div className="file-grid">
          {currentNodes.map((node, i) => (
            <div className="file-card" key={i} onClick={() => handleNodeClick(node)}>
              <div className="file-icon">
                {node.isDir ? '📁' : (node.name.endsWith('.md') || node.name.endsWith('.txt') ? '📄' : '📦')}
              </div>
              <div className="file-name" title={node.name}>
                {node.name}
              </div>
            </div>
          ))}
          {currentNodes.length === 0 && (
            <div style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>Folder is empty.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
