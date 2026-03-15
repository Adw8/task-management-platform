import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Comments from '../components/Comments';
import FileUpload from '../components/FileUpload';
import TaskFormModal from '../components/TaskFormModal';
import { getTask } from '../api/tasks';
import { getUsers, type UserSummary } from '../api/users';
import useTaskStore from '../store/taskStore';
import type { Task } from '../types/task';
import '../styles/task-detail.css';

function AssigneeName({ userId }: { userId: number | null }) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  useEffect(() => { getUsers().then(setUsers).catch(() => {}); }, []);
  if (!userId) return <>—</>;
  const user = users.find((u) => u.id === userId);
  return <>{user ? user.name : '—'}</>;
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deleteTask } = useTaskStore();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTask(Number(id))
      .then(setTask)
      .catch(() => setError('Task not found'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      navigate('/tasks');
    } catch {
      setError('Failed to delete task');
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  const statusLabels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  const priorityLabels = { low: 'Low', medium: 'Medium', high: 'High' };

  if (loading) {
    return (
      <div className="task-detail-page">
        <div className="detail-loading">Loading...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="task-detail-page">
        <div className="detail-error">{error || 'Task not found'}</div>
        <button className="btn-back" onClick={() => navigate('/tasks')}>← Back to Tasks</button>
      </div>
    );
  }

  return (
    <div className="task-detail-page">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate('/tasks')}>← Back</button>
        <div className="detail-actions">
          <button className="btn-action btn-edit" onClick={() => setShowEditModal(true)}>
            Edit
          </button>
          <button className="btn-action btn-delete" onClick={() => setShowConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-card">
        <h1 className="detail-title">{task.title}</h1>

        <div className="detail-badges">
          <span className={`badge badge-status-${task.status}`}>{statusLabels[task.status]}</span>
          <span className={`badge badge-priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
        </div>

        {task.description && (
          <div className="detail-section">
            <h2>Description</h2>
            <p className="detail-description">{task.description}</p>
          </div>
        )}

        <div className="detail-meta">
          <div className="meta-item">
            <span className="meta-label">Due Date</span>
            <span className="meta-value">
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Assignee</span>
            <span className="meta-value">
              <AssigneeName userId={task.assigned_to} />
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Created</span>
            <span className="meta-value">{new Date(task.created_at).toLocaleDateString()}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Last Updated</span>
            <span className="meta-value">{new Date(task.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="detail-section">
            <h2>Tags</h2>
            <div className="detail-tags">
              {task.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <FileUpload taskId={task.id} />
      <Comments taskId={task.id} />

      {showEditModal && task && (
        <TaskFormModal
          taskId={task.id}
          onClose={() => {
            setShowEditModal(false);
            // Refresh task data to reflect edits
            getTask(task.id).then(setTask).catch(() => {});
          }}
        />
      )}

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h2>Delete task?</h2>
            <p>This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
