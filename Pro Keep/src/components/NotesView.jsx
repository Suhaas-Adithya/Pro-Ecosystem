import React, { useState } from 'react';
import { PinIcon, TrashIcon, SearchIcon, PlusIcon, CloseIcon, EditIcon } from './Icons';

export default function NotesView({ notes, setNotes }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('personal');

  const categories = [
    { id: 'all', label: 'All Notes', class: '' },
    { id: 'personal', label: 'Personal', class: 'personal' },
    { id: 'work', label: 'Work', class: 'work' },
    { id: 'ideas', label: 'Ideas', class: 'ideas' },
    { id: 'tasks', label: 'Todo', class: 'tasks' },
  ];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      category,
      pinned: false,
      createdAt: new Date().toISOString(),
    };

    setNotes([newNote, ...notes]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingNote || !content.trim()) return;

    const updatedNotes = notes.map((note) =>
      note.id === editingNote.id
        ? { ...note, title: title.trim(), content: content.trim(), category }
        : note
    );

    setNotes(updatedNotes);
    resetForm();
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      setNotes(notes.filter((note) => note.id !== id));
      if (editingNote && editingNote.id === id) resetForm();
    }
  };

  const togglePin = (id, e) => {
    e.stopPropagation();
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned } : note
      )
    );
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('personal');
    setEditingNote(null);
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
  };

  // Filtering & Search
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const otherNotes = filteredNotes.filter((note) => !note.pinned);

  return (
    <div className="notes-view animate-slide-up">
      {/* Top Controls: Search and Add Button */}
      <div className="notes-controls">
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field search-input"
          />
        </div>

        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <PlusIcon size={18} /> New Note
        </button>
      </div>

      {/* Category Chips */}
      <div className="category-chips">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`chip ${categoryFilter === cat.id ? 'active' : ''}`}
            onClick={() => setCategoryFilter(cat.id)}
          >
            {cat.id !== 'all' && <span className={`dot ${cat.id}`} style={{ marginRight: '6px' }} />}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid Content */}
      <div className="notes-workspace">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <p className="no-items-text">No notes found matching your criteria.</p>
          </div>
        ) : (
          <>
            {pinnedNotes.length > 0 && (
              <div className="notes-section">
                <h3 className="section-title">Pinned</h3>
                <div className="notes-grid">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      onPin={togglePin}
                    />
                  ))}
                </div>
              </div>
            )}

            {otherNotes.length > 0 && (
              <div className="notes-section">
                {pinnedNotes.length > 0 && <h3 className="section-title" style={{ marginTop: '2rem' }}>Others</h3>}
                <div className="notes-grid">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                      onPin={togglePin}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Write / Edit Modal Overlay */}
      {(showAddModal || editingNote) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingNote ? 'Edit Note' : 'Create Note'}</h3>
              <button className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={editingNote ? handleUpdate : handleCreate} className="note-form">
              <input
                type="text"
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field note-title-input"
              />
              <textarea
                placeholder="Write note content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-field note-content-input"
                required
              />
              <div className="note-form-footer">
                <div className="category-picker">
                  {categories.filter(c => c.id !== 'all').map((cat) => (
                    <label
                      key={cat.id}
                      className={`category-radio-label ${category === cat.id ? 'selected' : ''} bg-${cat.id}`}
                    >
                      <input
                        type="radio"
                        name="note-category"
                        value={cat.id}
                        checked={category === cat.id}
                        onChange={() => setCategory(cat.id)}
                        className="hidden-radio"
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingNote ? 'Save Changes' : 'Create Note'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .notes-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .notes-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        @media (max-width: 600px) {
          .notes-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .search-bar-wrapper {
          position: relative;
          flex: 1;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          padding-left: 2.5rem;
        }

        .category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .notes-workspace {
          margin-top: 1rem;
        }

        .section-title {
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          border: 2px dashed var(--glass-border);
          border-radius: 16px;
        }

        /* Note Card Styling */
        .note-card-inner {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 200px;
          position: relative;
          border-left: 4px solid var(--text-muted);
          background: linear-gradient(135deg, var(--glass-bg), hsla(var(--hue), 20%, 100%, 0.01));
        }

        .note-card-inner.border-personal { border-left-color: var(--color-personal); }
        .note-card-inner.border-work { border-left-color: var(--color-work); }
        .note-card-inner.border-ideas { border-left-color: var(--color-ideas); }
        .note-card-inner.border-tasks { border-left-color: var(--color-tasks); }

        .note-card-inner:hover {
          border-left-width: 6px;
        }

        .note-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .note-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 80%;
        }

        .btn-pin {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-speed);
        }

        .btn-pin:hover, .btn-pin.active {
          color: var(--accent-color);
          background: hsla(250, 85%, 65%, 0.1);
        }

        .note-card-body {
          flex: 1;
          margin: 0.75rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          text-overflow: ellipsis;
        }

        .note-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: 0.75rem;
          border-top: 1px solid var(--glass-border);
        }

        .note-date {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .note-actions {
          display: flex;
          gap: 0.25rem;
        }

        .note-action-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-speed);
        }

        .note-action-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .note-action-btn:hover.delete {
          background: hsla(350, 80%, 55%, 0.1);
          color: var(--danger-color);
        }

        /* Modal Inner */
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .btn-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 50%;
          transition: all var(--transition-speed);
        }

        .btn-close:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .note-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .note-title-input {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .note-content-input {
          min-height: 200px;
          resize: vertical;
          line-height: 1.6;
        }

        .note-form-footer {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .category-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-radio-label {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--glass-border);
          transition: all var(--transition-speed);
          color: var(--text-secondary);
        }

        .category-radio-label.bg-personal { border-color: hsla(199, 89%, 48%, 0.3); }
        .category-radio-label.bg-work { border-color: hsla(271, 81%, 56%, 0.3); }
        .category-radio-label.bg-ideas { border-color: hsla(36, 100%, 50%, 0.3); }
        .category-radio-label.bg-tasks { border-color: hsla(142, 69%, 43%, 0.3); }

        .category-radio-label.selected.bg-personal { background: var(--color-personal); color: #fff; border-color: var(--color-personal); }
        .category-radio-label.selected.bg-work { background: var(--color-work); color: #fff; border-color: var(--color-work); }
        .category-radio-label.selected.bg-ideas { background: var(--color-ideas); color: #fff; border-color: var(--color-ideas); }
        .category-radio-label.selected.bg-tasks { background: var(--color-tasks); color: #fff; border-color: var(--color-tasks); }

        .hidden-radio {
          display: none;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </div>
  );
}

// Subcomponent NoteCard
function NoteCard({ note, onEdit, onDelete, onPin }) {
  const formattedDate = new Date(note.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={`glass-card note-card-inner border-${note.category}`} onClick={() => onEdit(note)}>
      <div className="note-card-header">
        <h4 className="note-card-title">{note.title}</h4>
        <button
          className={`btn-pin ${note.pinned ? 'active' : ''}`}
          onClick={(e) => onPin(note.id, e)}
          title={note.pinned ? 'Unpin note' : 'Pin note'}
        >
          <PinIcon size={16} fill={note.pinned ? 'var(--accent-color)' : 'none'} />
        </button>
      </div>

      <div className="note-card-body">
        {note.content}
      </div>

      <div className="note-card-footer">
        <span className="note-date">{formattedDate}</span>
        <div className="note-actions">
          <button
            className="note-action-btn edit"
            onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            title="Edit note"
          >
            <EditIcon size={14} />
          </button>
          <button
            className="note-action-btn delete"
            onClick={(e) => onDelete(note.id, e)}
            title="Delete note"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
