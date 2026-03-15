import { useEffect, useState } from 'react';
import { getTask } from '../api/tasks';
import { getUsers, type UserSummary } from '../api/users';
import useTaskStore from '../store/taskStore';
import type { TaskPriority, TaskStatus } from '../types/task';
import '../styles/task-form-modal.css';

interface FormState {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  tags: string[];
  tagInput: string;
  assigned_to: number | null;
}

const DEFAULT_FORM: FormState = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  tags: [],
  tagInput: '',
  assigned_to: null,
};

interface Props {
  onClose: () => void;
  taskId?: number;
}

export default function TaskFormModal({ onClose, taskId }: Props) {
  const isEdit = taskId !== undefined;
  const { createTask, updateTask } = useTaskStore();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit || !taskId) return;
    getTask(taskId)
      .then((task) => {
        setForm({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          due_date: task.due_date ? task.due_date.slice(0, 10) : '',
          tags: task.tags,
          tagInput: '',
          assigned_to: task.assigned_to ?? null,
        });
      })
      .catch(() => setFormError('Failed to load task'))
      .finally(() => setFetching(false));
  }, [isEdit, taskId]);

  function validate() {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.title.length > 255) errs.title = 'Title must be under 255 characters';
    return errs;
  }

  function addTag() {
    const tag = form.tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, tag], tagInput: '' }));
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setFormError('');
    setLoading(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      tags: form.tags,
      assigned_to: form.assigned_to ?? undefined,
    };

    try {
      if (isEdit && taskId) {
        await updateTask(taskId, payload);
      } else {
        await createTask(payload);
      }
      onClose();
    } catch {
      setFormError('Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {fetching ? (
          <div className="modal-loading">Loading...</div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit} noValidate>
            {formError && <div className="form-error">{formError}</div>}

            <div className="form-group">
              <label htmlFor="modal-title">Title *</label>
              <input
                id="modal-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className={errors.title ? 'error' : ''}
                placeholder="Task title"
                autoFocus
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="modal-description">Description</label>
              <textarea
                id="modal-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="modal-status">Status</label>
                <select
                  id="modal-status"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="modal-priority">Priority</label>
                <select
                  id="modal-priority"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="modal-due_date">Due Date</label>
              <input
                id="modal-due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
              />
            </div>

            {users.length > 0 && (
              <div className="form-group">
                <label htmlFor="modal-assignee">Assignee</label>
                <select
                  id="modal-assignee"
                  value={form.assigned_to ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value ? Number(e.target.value) : null }))}
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Tags</label>
              <div className="tags-input-wrapper">
                <input
                  type="text"
                  value={form.tagInput}
                  onChange={(e) => setForm((f) => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Add a tag and press Enter"
                />
                <button type="button" className="btn-add-tag" onClick={addTag}>Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="tags-preview">
                  {form.tags.map((tag) => (
                    <span key={tag} className="tag-removable">
                      {tag}
                      <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
