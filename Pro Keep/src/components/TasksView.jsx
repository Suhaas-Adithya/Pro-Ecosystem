import React, { useState } from 'react';
import { TrashIcon, SearchIcon, PlusIcon, CloseIcon, EditIcon, CheckIcon } from './Icons';

export default function TasksView({ tasks, setTasks }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form states for creating/editing task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState('medium');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [subtasks, setSubtasks] = useState([]); // Array of { id, text, completed }
  const [newSubtaskText, setNewSubtaskText] = useState('');

  const categories = [
    { id: 'all', label: 'All', class: '' },
    { id: 'personal', label: 'Personal', class: 'personal' },
    { id: 'work', label: 'Work', class: 'work' },
    { id: 'ideas', label: 'Ideas', class: 'ideas' },
    { id: 'tasks', label: 'Todo', class: 'tasks' },
  ];

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      status: 'todo', // default column
      category,
      priority,
      subtasks,
      createdAt: new Date().toISOString()
    };

    setTasks([newTask, ...tasks]);
    resetForm();
    setShowAddModal(false);
  };

  const handleUpdateTask = (e) => {
    e.preventDefault();
    if (!editingTask || !title.trim()) return;

    const updated = tasks.map((t) =>
      t.id === editingTask.id
        ? { ...t, title: title.trim(), description: description.trim(), category, priority, subtasks }
        : t
    );

    setTasks(updated);
    resetForm();
  };

  const handleDeleteTask = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task?')) {
      setTasks(tasks.filter((t) => t.id !== id));
      if (editingTask && editingTask.id === id) resetForm();
    }
  };

  const moveTaskStatus = (id, newStatus, e) => {
    e.stopPropagation();
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const toggleSubtask = (taskId, subtaskId, e) => {
    e.stopPropagation();
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubtasks = t.subtasks.map(sub =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        
        // If all subtasks are complete, optionally shift status to done? We'll let the user decide, but we update progress.
        return { ...t, subtasks: updatedSubtasks };
      }
      return t;
    }));
  };

  // Adding subtasks inside the composer/editor
  const addSubtaskToDraft = () => {
    if (!newSubtaskText.trim()) return;
    const sub = {
      id: Date.now().toString() + Math.random(),
      text: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks([...subtasks, sub]);
    setNewSubtaskText('');
  };

  const removeSubtaskFromDraft = (id) => {
    setSubtasks(subtasks.filter(sub => sub.id !== id));
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('personal');
    setPriority('medium');
    setSubtasks([]);
    setNewSubtaskText('');
    setEditingTask(null);
  };

  const startEditTask = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setPriority(task.priority);
    setSubtasks(task.subtasks || []);
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Split into columns
  const columns = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    inProgress: filteredTasks.filter(t => t.status === 'in-progress'),
    done: filteredTasks.filter(t => t.status === 'done')
  };

  const getPriorityBadgeClass = (pr) => {
    switch (pr) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  return (
    <div className="tasks-view animate-slide-up">
      {/* Top action controls */}
      <div className="tasks-controls">
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field search-input"
          />
        </div>

        <button className="btn btn-primary" onClick={() => { resetForm(); setShowAddModal(true); }}>
          <PlusIcon size={18} /> New Task
        </button>
      </div>

      {/* Category Chips Filters */}
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

      {/* Three Column Kanban Dashboard */}
      <div className="kanban-board">
        {/* TO DO Column */}
        <div className="kanban-column glass-card">
          <div className="column-header border-todo">
            <h3>To Do</h3>
            <span className="column-count">{columns.todo.length}</span>
          </div>
          <div className="column-body">
            {columns.todo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={startEditTask}
                onDelete={handleDeleteTask}
                onToggleSubtask={toggleSubtask}
                onMoveLeft={null}
                onMoveRight={(e) => moveTaskStatus(task.id, 'in-progress', e)}
                badgeClass={getPriorityBadgeClass}
              />
            ))}
          </div>
        </div>

        {/* IN PROGRESS Column */}
        <div className="kanban-column glass-card">
          <div className="column-header border-progress">
            <h3>In Progress</h3>
            <span className="column-count">{columns.inProgress.length}</span>
          </div>
          <div className="column-body">
            {columns.inProgress.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={startEditTask}
                onDelete={handleDeleteTask}
                onToggleSubtask={toggleSubtask}
                onMoveLeft={(e) => moveTaskStatus(task.id, 'todo', e)}
                onMoveRight={(e) => moveTaskStatus(task.id, 'done', e)}
                badgeClass={getPriorityBadgeClass}
              />
            ))}
          </div>
        </div>

        {/* COMPLETED Column */}
        <div className="kanban-column glass-card">
          <div className="column-header border-done">
            <h3>Completed</h3>
            <span className="column-count">{columns.done.length}</span>
          </div>
          <div className="column-body">
            {columns.done.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={startEditTask}
                onDelete={handleDeleteTask}
                onToggleSubtask={toggleSubtask}
                onMoveLeft={(e) => moveTaskStatus(task.id, 'in-progress', e)}
                onMoveRight={null}
                badgeClass={getPriorityBadgeClass}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add / Edit Task Modal Overlay */}
      {(showAddModal || editingTask) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content tasks-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Edit Task Card' : 'Create Task Card'}</h3>
              <button className="btn-close" onClick={() => { setShowAddModal(false); resetForm(); }}>
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="task-composer-form">
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Task card description details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field task-description-input"
                />
              </div>

              <div className="form-row-double">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field"
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="ideas">Ideas</option>
                    <option value="tasks">Todo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-field"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Checklist Composer */}
              <div className="form-group checklist-composer">
                <label>Subtask Checklist</label>
                <div className="subtask-composer-input">
                  <input
                    type="text"
                    placeholder="Add item..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtaskToDraft(); } }}
                    className="input-field"
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addSubtaskToDraft}>
                    Add
                  </button>
                </div>

                <div className="subtask-draft-list">
                  {subtasks.map((sub) => (
                    <div key={sub.id} className="subtask-draft-item">
                      <span className="subtask-text">{sub.text}</span>
                      <button
                        type="button"
                        className="btn-remove-subtask"
                        onClick={() => removeSubtaskFromDraft(sub.id)}
                      >
                        <CloseIcon size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .tasks-view {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tasks-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
        }

        @media (max-width: 600px) {
          .tasks-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .kanban-board {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1.5rem;
          margin-top: 1rem;
          align-items: start;
        }

        @media (max-width: 1000px) {
          .kanban-board {
            grid-template-columns: 1fr;
          }
        }

        .kanban-column {
          padding: 1.25rem 1rem;
          min-height: 550px;
          background: linear-gradient(180deg, var(--glass-bg), hsla(var(--hue), 20%, 100%, 0.005));
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .column-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid var(--glass-border);
          margin-bottom: 0.5rem;
        }

        .column-header h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .column-header.border-todo { border-bottom-color: var(--color-personal); }
        .column-header.border-progress { border-bottom-color: var(--warning-color); }
        .column-header.border-done { border-bottom-color: var(--success-color); }

        .column-count {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }

        .column-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
          overflow-y: auto;
          max-height: 600px;
          padding-right: 0.2rem;
        }

        /* Task Card Styling */
        .task-card-inner {
          padding: 1rem;
          border-left: 4px solid var(--text-muted);
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-left: 4px solid var(--text-muted);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          cursor: pointer;
          transition: all var(--transition-speed);
        }

        .task-card-inner:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          border-color: hsla(var(--hue), 20%, 100%, 0.12);
        }

        .task-card-inner.border-personal { border-left-color: var(--color-personal); }
        .task-card-inner.border-work { border-left-color: var(--color-work); }
        .task-card-inner.border-ideas { border-left-color: var(--color-ideas); }
        .task-card-inner.border-tasks { border-left-color: var(--color-tasks); }

        .task-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }

        .task-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
        }

        .task-meta-top {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .task-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.45;
          word-break: break-word;
        }

        /* Task Subtask Checklist */
        .task-subtasks-wrapper {
          border-top: 1px solid var(--glass-border);
          padding-top: 0.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .task-subtask-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .task-subtask-checkbox {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1px solid var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          transition: all var(--transition-speed);
        }

        .task-subtask-checkbox.checked {
          background: var(--success-color);
          border-color: var(--success-color);
        }

        .task-subtask-row:hover .task-subtask-checkbox {
          border-color: var(--accent-color);
        }

        .task-subtask-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .task-subtask-label.checked {
          text-decoration: line-through;
          color: var(--text-muted);
        }

        /* Progress Bar Styling */
        .task-progress-box {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .progress-bar-bg {
          width: 100%;
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--success-color);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .progress-bar-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
          text-align: right;
        }

        /* Task Action Footer */
        .task-card-footer {
          border-top: 1px solid var(--glass-border);
          padding-top: 0.6rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .task-shift-controls {
          display: flex;
          gap: 0.2rem;
        }

        .task-shift-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all var(--transition-speed);
        }

        .task-shift-btn:hover {
          background: var(--accent-color);
          color: #fff;
          border-color: var(--accent-color);
        }

        /* Composer specifics */
        .tasks-modal {
          max-width: 550px;
        }

        .task-composer-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .task-description-input {
          min-height: 80px;
          resize: vertical;
        }

        .subtask-composer-input {
          display: flex;
          gap: 0.5rem;
        }

        .subtask-draft-list {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          max-height: 150px;
          overflow-y: auto;
          margin-top: 0.5rem;
          padding-right: 0.2rem;
        }

        .subtask-draft-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem 0.75rem;
          border-radius: 6px;
          background: var(--bg-tertiary);
          border: 1px solid var(--glass-border);
        }

        .subtask-text {
          font-size: 0.82rem;
          color: var(--text-primary);
        }

        .btn-remove-subtask {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.1rem;
          display: flex;
        }

        .btn-remove-subtask:hover {
          color: var(--danger-color);
        }
      `}</style>
    </div>
  );
}

// Subcomponent TaskCard
function TaskCard({ task, onEdit, onDelete, onToggleSubtask, onMoveLeft, onMoveRight, badgeClass }) {
  const subtasksCount = task.subtasks ? task.subtasks.length : 0;
  const completedCount = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const percent = subtasksCount > 0 ? Math.round((completedCount / subtasksCount) * 100) : 0;

  return (
    <div className={`task-card-inner border-${task.category}`} onClick={() => onEdit(task)}>
      <div className="task-card-header">
        <h4 className="task-title">{task.title}</h4>
        <div className="task-meta-top">
          <span className={`dot ${task.category}`} title={task.category} />
          <span className={`rem-badge ${badgeClass(task.priority)}`} style={{ zoom: 0.9 }}>
            {task.priority}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="task-desc">{task.description}</p>
      )}

      {/* Subtasks checklist on card */}
      {subtasksCount > 0 && (
        <div className="task-subtasks-wrapper">
          {task.subtasks.slice(0, 3).map(sub => (
            <div
              key={sub.id}
              className="task-subtask-row"
              onClick={(e) => onToggleSubtask(task.id, sub.id, e)}
            >
              <div className={`task-subtask-checkbox ${sub.completed ? 'checked' : ''}`}>
                {sub.completed && <CheckIcon size={8} style={{ color: '#fff' }} />}
              </div>
              <span className={`task-subtask-label ${sub.completed ? 'checked' : ''}`}>
                {sub.text}
              </span>
            </div>
          ))}
          {subtasksCount > 3 && (
            <span className="progress-bar-text" style={{ textAlign: 'left', fontStyle: 'italic', display: 'block', marginTop: '0.1rem' }}>
              + {subtasksCount - 3} more items...
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {subtasksCount > 0 && (
        <div className="task-progress-box">
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
          </div>
          <span className="progress-bar-text">
            {completedCount}/{subtasksCount} ({percent}%)
          </span>
        </div>
      )}

      {/* Shift Columns controls & Card actions */}
      <div className="task-card-footer">
        <div className="task-shift-controls">
          {onMoveLeft && (
            <button
              type="button"
              className="task-shift-btn"
              onClick={onMoveLeft}
              title="Move backward"
            >
              ←
            </button>
          )}
          {onMoveRight && (
            <button
              type="button"
              className="task-shift-btn"
              onClick={onMoveRight}
              title="Move forward"
            >
              →
            </button>
          )}
        </div>

        <div className="alarm-actions">
          <button
            className="note-action-btn edit"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            title="Edit task card"
          >
            <EditIcon size={12} />
          </button>
          <button
            className="note-action-btn delete"
            onClick={(e) => onDelete(task.id, e)}
            title="Delete task card"
          >
            <TrashIcon size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
