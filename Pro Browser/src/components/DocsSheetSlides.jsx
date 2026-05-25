import React, { useState, useEffect } from 'react';

// ==========================================
// 1. PRO DOCS MODULE (pro://docs)
// ==========================================
export function ProDocs() {
  const [docTitle, setDocTitle] = useState('Untitled Workspace Document');
  const [docContent, setDocContent] = useState('# Project Roadmap 🚀\n\nWrite rich documentation here. Supports automatic Markdown formatting shortcuts:\n- Use `# ` for large headers\n- Use `## ` for section subtitles\n\n*This document is fully tethered to your Keep database!*');
  const [showKeepNotes, setShowKeepNotes] = useState(false);
  const [keepNotes, setKeepNotes] = useState([]);

  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('prokeep-notes') || '[]');
      setKeepNotes(items);
    } catch (e) {
      console.warn("Could not load Keep notes for Docs", e);
    }
  }, [showKeepNotes]);

  const handleImportNote = (note) => {
    setDocContent(prev => `${prev}\n\n### Imported: ${note.title} ✦\n${note.content}`);
    setShowKeepNotes(false);
  };

  const parseMarkdown = (text) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="doc-h1">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={i} className="doc-h2">{line.slice(3)}</h2>;
      } else if (line.startsWith('- ')) {
        return <li key={i} className="doc-li">{line.slice(2)}</li>;
      }
      return <p key={i} className="doc-p">{line}</p>;
    });
  };

  return (
    <div className="pro-docs-view animate-slide-up">
      <div className="docs-toolbar">
        <input
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          className="docs-title-input"
        />
        <button className="btn btn-secondary btn-sm" onClick={() => setShowKeepNotes(!showKeepNotes)}>
          {showKeepNotes ? 'Hide Keep Drawer' : '✦ Import Keep Note'}
        </button>
      </div>

      <div className="docs-workspace">
        <div className="docs-editor-container">
          <textarea
            value={docContent}
            onChange={(e) => setDocContent(e.target.value)}
            className="docs-textarea"
            placeholder="Start typing..."
          />
        </div>

        {/* Live Preview Panel */}
        <div className="docs-preview-container glass-card">
          <div className="preview-header">Live Document Review</div>
          <div className="preview-body">
            <h1 className="preview-doc-title">{docTitle}</h1>
            <hr className="preview-hr"/>
            {parseMarkdown(docContent)}
          </div>
        </div>

        {/* Keep Notes Import Drawer */}
        {showKeepNotes && (
          <div className="keep-drawer glass-card">
            <div className="drawer-header">
              <h4>Select Note to Import</h4>
              <button className="btn-close" onClick={() => setShowKeepNotes(false)}>×</button>
            </div>
            <div className="drawer-body">
              {keepNotes.length > 0 ? (
                keepNotes.map(note => (
                  <div key={note.id} className="drawer-note-item" onClick={() => handleImportNote(note)}>
                    <strong>{note.title}</strong>
                    <p>{note.content.substring(0, 50)}...</p>
                  </div>
                ))
              ) : (
                <p className="no-items-text">No Keep notes found.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pro-docs-view {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }
        .docs-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          padding: 0.5rem 1rem;
          border-radius: 12px;
        }
        .docs-title-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          outline: none;
          width: 60%;
        }
        .docs-workspace {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          height: 500px;
          position: relative;
        }
        .docs-editor-container {
          height: 100%;
        }
        .docs-textarea {
          width: 100%;
          height: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          color: var(--text-primary);
          font-family: monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          padding: 1.5rem;
          resize: none;
          outline: none;
        }
        .docs-textarea:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .docs-preview-container {
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          padding: 2rem !important;
        }
        .preview-header {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .preview-body {
          flex: 1;
        }
        .preview-doc-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .preview-hr {
          border: none;
          height: 1px;
          background: var(--glass-border);
          margin: 1rem 0;
        }
        .doc-h1 { font-size: 1.45rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--accent-color); }
        .doc-h2 { font-size: 1.2rem; font-weight: 700; margin-top: 0.75rem; margin-bottom: 0.4rem; color: var(--text-primary); }
        .doc-p { font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary); margin-bottom: 0.6rem; }
        .doc-li { font-size: 0.88rem; color: var(--text-secondary); margin-left: 1.25rem; margin-bottom: 0.3rem; list-style-type: square; }
        .keep-drawer {
          position: absolute;
          top: 0;
          right: 0;
          width: 300px;
          height: 100%;
          z-index: 10;
          display: flex;
          flex-direction: column;
          animation: slide-in 0.3s ease;
        }
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 0.5rem;
          margin-bottom: 1rem;
        }
        .drawer-body {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .drawer-note-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 0.6rem;
          cursor: pointer;
          transition: all var(--transition-speed);
        }
        .drawer-note-item:hover {
          background: var(--accent-glow);
          border-color: var(--accent-color);
        }
        .drawer-note-item strong { display: block; font-size: 0.85rem; }
        .drawer-note-item p { font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.15rem; }
      `}</style>
    </div>
  );
}

// ==========================================
// 2. PRO SHEETS MODULE (pro://sheets)
// ==========================================
export function ProSheets() {
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rows = Array.from({ length: 12 }, (_, i) => i + 1);

  // Grid state storing raw text input of cells (e.g. "10" or "=SUM(A1:A5)")
  const [gridData, setGridData] = useState({
    'A1': '15', 'A2': '30', 'A3': '45', 'A4': '10', 'A5': '50',
    'B1': 'Active', 'B2': 'Pending', 'B3': 'Active', 'B4': 'Suspended',
    'C1': '=SUM(A1:A5)', 'C2': '=AVERAGE(A1:A5)'
  });
  
  // Grid state storing evaluated numeric / computed values of cells
  const [evaluatedGrid, setEvaluatedGrid] = useState({});

  const [activeCell, setActiveCell] = useState(null);
  const [cellInput, setCellInput] = useState('');

  useEffect(() => {
    evaluateAllCells();
  }, [gridData]);

  const parseCellValue = (cellId, rawData) => {
    if (!rawData) return '';
    if (!rawData.startsWith('=')) return rawData;

    try {
      const formula = rawData.substring(1).toUpperCase();
      
      // SUM calculation: e.g. SUM(A1:A5)
      if (formula.startsWith('SUM(')) {
        const range = formula.match(/\(([^)]+)\)/)?.[1];
        if (range) {
          const cells = getCellsInRange(range);
          let sum = 0;
          cells.forEach(c => {
            const val = parseFloat(gridData[c]);
            if (!isNaN(val)) sum += val;
          });
          return sum.toString();
        }
      }
      
      // AVERAGE calculation: e.g. AVERAGE(A1:A5)
      if (formula.startsWith('AVERAGE(')) {
        const range = formula.match(/\(([^)]+)\)/)?.[1];
        if (range) {
          const cells = getCellsInRange(range);
          let sum = 0;
          let count = 0;
          cells.forEach(c => {
            const val = parseFloat(gridData[c]);
            if (!isNaN(val)) {
              sum += val;
              count++;
            }
          });
          return count > 0 ? (sum / count).toFixed(2) : '0';
        }
      }

      return 'Formula Error';
    } catch (e) {
      return '#ERROR';
    }
  };

  const getCellsInRange = (rangeStr) => {
    const parts = rangeStr.split(':');
    if (parts.length !== 2) return [rangeStr];
    
    const startCell = parts[0];
    const endCell = parts[1];
    
    const startCol = startCell.charCodeAt(0);
    const startRow = parseInt(startCell.substring(1));
    const endCol = endCell.charCodeAt(0);
    const endRow = parseInt(endCell.substring(1));
    
    const cells = [];
    for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        cells.push(String.fromCharCode(c) + r);
      }
    }
    return cells;
  };

  const evaluateAllCells = () => {
    const evaluated = {};
    Object.keys(gridData).forEach((cellId) => {
      evaluated[cellId] = parseCellValue(cellId, gridData[cellId]);
    });
    setEvaluatedGrid(evaluated);
  };

  const handleCellClick = (cellId) => {
    setActiveCell(cellId);
    setCellInput(gridData[cellId] || '');
  };

  const handleCellSubmit = (e) => {
    e.preventDefault();
    if (!activeCell) return;
    setGridData(prev => ({ ...prev, [activeCell]: cellInput }));
    setActiveCell(null);
  };

  // Compile vector metrics for charts
  const seriesData = ['A1', 'A2', 'A3', 'A4', 'A5'].map(cell => parseFloat(evaluatedGrid[cell] || 0));
  const maxVal = Math.max(...seriesData, 1);

  return (
    <div className="pro-sheets-view animate-slide-up">
      <div className="sheets-toolbar">
        <span className="formula-label">fx:</span>
        <form onSubmit={handleCellSubmit} className="formula-form">
          <input
            type="text"
            value={cellInput}
            onChange={(e) => setCellInput(e.target.value)}
            placeholder={activeCell ? `Editing Cell ${activeCell}... Enter values or formula (=SUM(A1:A5))` : "Select cell to edit..."}
            className="input-field formula-input"
            disabled={!activeCell}
          />
          {activeCell && (
            <button type="submit" className="btn btn-primary btn-sm">Apply</button>
          )}
        </form>
      </div>

      <div className="sheets-layout-row">
        {/* The Spreadsheet Grid */}
        <div className="grid-wrapper glass-card">
          <table className="sheets-table">
            <thead>
              <tr>
                <th className="row-hdr"></th>
                {columns.map(col => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row}>
                  <td className="row-hdr">{row}</td>
                  {columns.map(col => {
                    const cellId = `${col}${row}`;
                    const rawVal = gridData[cellId] || '';
                    const evalVal = evaluatedGrid[cellId] || '';
                    const isActive = activeCell === cellId;
                    
                    return (
                      <td
                        key={col}
                        className={`sheet-cell ${isActive ? 'active' : ''} ${rawVal.startsWith('=') ? 'computed' : ''}`}
                        onClick={() => handleCellClick(cellId)}
                      >
                        {evalVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Vector Analytics Charts */}
        <div className="glass-card sheets-chart-card">
          <h4>Visual Sheet Charts</h4>
          <p className="subtitle">Dynamic metrics compiled natively from grid range A1:A5</p>
          
          <div className="chart-bar-container">
            {seriesData.map((val, idx) => {
              const heightPct = (val / maxVal) * 100;
              return (
                <div key={idx} className="chart-bar-col">
                  <div className="chart-bar-fill" style={{ height: `${heightPct}%` }}>
                    <span className="bar-val">{val}</span>
                  </div>
                  <span className="bar-lbl">A{idx + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .pro-sheets-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .sheets-toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 0.5rem 1rem;
        }
        .formula-label {
          font-family: monospace;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--accent-color);
        }
        .formula-form {
          flex: 1;
          display: flex;
          gap: 0.5rem;
        }
        .formula-input {
          flex: 1;
          font-size: 0.85rem;
          font-family: monospace;
        }
        .sheets-layout-row {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .sheets-layout-row {
            grid-template-columns: 1fr;
          }
        }
        .grid-wrapper {
          padding: 0 !important;
          overflow-x: auto;
        }
        .sheets-table {
          width: 100%;
          border-collapse: collapse;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          text-align: left;
        }
        .sheets-table th, .sheets-table td {
          border: 1px solid var(--glass-border);
          padding: 0.4rem 0.6rem;
          min-width: 60px;
        }
        .sheets-table th {
          background: rgba(255, 255, 255, 0.02);
          color: var(--text-secondary);
          text-align: center;
          font-weight: 600;
        }
        .row-hdr {
          background: rgba(255, 255, 255, 0.02) !important;
          color: var(--text-secondary);
          font-weight: 700;
          text-align: center;
          width: 30px !important;
          min-width: 30px !important;
        }
        .sheet-cell {
          cursor: pointer;
          color: var(--text-primary);
          transition: background-color var(--transition-speed);
        }
        .sheet-cell:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .sheet-cell.active {
          background: var(--accent-glow) !important;
          border: 1.5px solid var(--accent-color) !important;
          color: var(--accent-color);
          font-weight: 600;
        }
        .sheet-cell.computed {
          color: var(--warning-color);
        }
        .sheets-chart-card {
          display: flex;
          flex-direction: column;
          height: 350px;
        }
        .sheets-chart-card h4 {
          font-size: 1.05rem;
        }
        .sheets-chart-card .subtitle {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
        }
        .chart-bar-container {
          flex: 1;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          border-bottom: 2px solid var(--glass-border);
          padding-bottom: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .chart-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          width: 35px;
        }
        .chart-bar-fill {
          width: 100%;
          background: linear-gradient(180deg, var(--accent-color), var(--accent-hover));
          border-radius: 6px 6px 0 0;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          transition: height 0.5s ease;
          position: relative;
          box-shadow: 0 4px 15px var(--accent-glow);
        }
        .bar-val {
          font-size: 0.65rem;
          font-weight: 700;
          color: #fff;
          margin-top: -18px;
          position: absolute;
        }
        .bar-lbl {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 0.35rem;
        }
      `}</style>
    </div>
  );
}

// ==========================================
// 3. PRO SLIDES MODULE (pro://slides)
// ==========================================
export function ProSlides() {
  const [slides, setSlides] = useState([
    { id: '1', title: 'Pro Suite Overview ✦', subtitle: 'The Autonomous Workspace OS', bullet1: 'Zero-latency local WebSocket data mesh', bullet2: 'Gemma 4 Edge AI compiler and automation subagents', theme: 'cyber-dark' },
    { id: '2', title: 'Chromium-Free Browser 🌐', subtitle: 'Built Completely From Scratch', bullet1: 'Micro-engine DOM parser & CSS style cascade resolver', bullet2: 'Cloud-Tethered visual coordinate canvas painter', theme: 'neon-glow' }
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPreview, setIsPreview] = useState(false);

  // Composer Form States
  const activeSlide = slides[activeSlideIndex];

  const handleUpdateSlide = (field, val) => {
    setSlides(prev => prev.map((s, idx) =>
      idx === activeSlideIndex ? { ...s, [field]: val } : s
    ));
  };

  const handleAddSlide = () => {
    const newSlide = {
      id: Date.now().toString(),
      title: 'New Presentation Slide',
      subtitle: 'Slide Subtitle Text',
      bullet1: 'Bullet detail row 1',
      bullet2: 'Bullet detail row 2',
      theme: 'minimal-glass'
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
  };

  const handleDeleteSlide = (index, e) => {
    e.stopPropagation();
    if (slides.length === 1) return;
    const nextIndex = Math.max(0, activeSlideIndex - 1);
    setSlides(slides.filter((_, idx) => idx !== index));
    setActiveSlideIndex(nextIndex);
  };

  return (
    <div className="pro-slides-view animate-slide-up">
      <div className="slides-toolbar">
        <button className="btn btn-secondary btn-sm" onClick={handleAddSlide}>+ Add Slide</button>
        <button className="btn btn-primary btn-sm" onClick={() => setIsPreview(true)}>✦ Run Presentation</button>
      </div>

      <div className="slides-layout-row">
        {/* Left Sidebar slide selector thumbnails */}
        <div className="slides-sidebar glass-card">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`slide-thumb ${activeSlideIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveSlideIndex(idx)}
            >
              <div className="thumb-header">
                <span>Slide {idx + 1}</span>
                <button className="btn-delete" onClick={(e) => handleDeleteSlide(idx, e)}>×</button>
              </div>
              <div className={`thumb-body bg-${slide.theme}`}>
                <span className="thumb-title">{slide.title}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Slide Composer Workspace */}
        <div className="slide-composer glass-card">
          <div className="slide-theme-picker">
            <label>Canvas Theme Style:</label>
            {['cyber-dark', 'neon-glow', 'minimal-glass'].map(t => (
              <button
                key={t}
                className={`theme-badge ${activeSlide.theme === t ? 'active' : ''}`}
                onClick={() => handleUpdateSlide('theme', t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="slide-inputs-form">
            <div className="form-group">
              <label>Slide Title</label>
              <input
                type="text"
                value={activeSlide.title}
                onChange={(e) => handleUpdateSlide('title', e.target.value)}
                className="input-field slide-title-in"
              />
            </div>
            <div className="form-group">
              <label>Subtitle / Description</label>
              <input
                type="text"
                value={activeSlide.subtitle}
                onChange={(e) => handleUpdateSlide('subtitle', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Bullet Row 1</label>
              <input
                type="text"
                value={activeSlide.bullet1}
                onChange={(e) => handleUpdateSlide('bullet1', e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Bullet Row 2</label>
              <input
                type="text"
                value={activeSlide.bullet2}
                onChange={(e) => handleUpdateSlide('bullet2', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Presentation Playback Modal */}
      {isPreview && (
        <div className="presentation-modal-overlay" onClick={() => setIsPreview(false)}>
          <div className="presentation-container" onClick={(e) => e.stopPropagation()}>
            <div className={`presentation-slide bg-${activeSlide.theme}`}>
              <div className="presenter-header">
                <span>Slide {activeSlideIndex + 1} of {slides.length}</span>
                <button className="btn-close-presenter" onClick={() => setIsPreview(false)}>Exit Show</button>
              </div>
              <div className="presenter-body">
                <h1 className="presenter-title">{activeSlide.title}</h1>
                <h3 className="presenter-subtitle">{activeSlide.subtitle}</h3>
                <hr className="presenter-hr"/>
                <ul className="presenter-bullets">
                  {activeSlide.bullet1 && <li>✦ {activeSlide.bullet1}</li>}
                  {activeSlide.bullet2 && <li>✦ {activeSlide.bullet2}</li>}
                </ul>
              </div>
              <div className="presenter-footer">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeSlideIndex === 0}
                >
                  ← Prev
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
                  disabled={activeSlideIndex === slides.length - 1}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .pro-slides-view {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .slides-toolbar {
          display: flex;
          gap: 0.75rem;
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          padding: 0.5rem 1rem;
        }
        .slides-layout-row {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
        }
        @media (max-width: 800px) {
          .slides-layout-row {
            grid-template-columns: 1fr;
          }
        }
        .slides-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
          padding: 1rem !important;
        }
        .slide-thumb {
          border: 2.5px solid var(--glass-border);
          border-radius: 8px;
          padding: 0.4rem;
          cursor: pointer;
          transition: all var(--transition-speed);
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .slide-thumb.active {
          border-color: var(--accent-color);
          box-shadow: 0 0 10px var(--accent-glow);
        }
        .thumb-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          color: var(--text-secondary);
          font-weight: 700;
        }
        .btn-delete {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-weight: 800;
        }
        .btn-delete:hover {
          color: var(--danger-color);
        }
        .thumb-body {
          height: 70px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          text-align: center;
        }
        .thumb-title {
          font-size: 0.65rem;
          font-weight: 800;
          color: #fff;
          word-break: break-all;
        }
        /* Thumbnail themes styles */
        .bg-cyber-dark { background: linear-gradient(135deg, #090a0f, #16171d) !important; border: 1px solid rgba(255,255,255,0.05); }
        .bg-neon-glow { background: linear-gradient(135deg, #1e1b4b, #311042) !important; border: 1px solid rgba(139,92,246,0.2); }
        .bg-minimal-glass { background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01)) !important; border: 1px solid rgba(255, 255, 255, 0.08); }

        .slide-composer {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .slide-theme-picker {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .theme-badge {
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 0.25rem 0.5rem;
          font-size: 0.72rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all var(--transition-speed);
          text-transform: capitalize;
        }
        .theme-badge.active {
          background: var(--accent-color);
          color: #fff;
          border-color: var(--accent-color);
          box-shadow: 0 2px 6px var(--accent-glow);
        }
        .slide-inputs-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .slide-title-in {
          font-size: 1.05rem;
          font-weight: 700;
        }

        /* Presentation modal */
        .presentation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #050508;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .presentation-container {
          width: 90%;
          max-width: 900px;
          height: 80%;
          max-height: 600px;
        }
        .presentation-slide {
          width: 100%;
          height: 100%;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem;
          position: relative;
        }
        .presenter-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .btn-close-presenter {
          background: none;
          border: none;
          color: var(--danger-color);
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }
        .presenter-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: left;
        }
        .presenter-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.04em;
        }
        .bg-neon-glow .presenter-title {
          text-shadow: 0 0 15px rgba(236, 72, 153, 0.4);
        }
        .presenter-subtitle {
          font-size: 1.35rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin-top: 0.5rem;
        }
        .presenter-hr {
          border: none;
          height: 2px;
          background: var(--accent-color);
          width: 100px;
          margin: 1.5rem 0;
          box-shadow: 0 0 8px var(--accent-color);
        }
        .presenter-bullets {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .presenter-bullets li {
          font-size: 1.05rem;
          color: #d1d5db;
          list-style: none;
        }
        .presenter-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
}
