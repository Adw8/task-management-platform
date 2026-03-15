import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TaskFormModal from '../components/TaskFormModal';
import useTaskStore from '../store/taskStore';
import type { Task, TaskPriority, TaskStatus } from '../types/task';
import '../styles/tasks.css';

function StatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };
  return <span className={`badge badge-status-${status}`}>{labels[status]}</span>;
}

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const labels: Record<TaskPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return <span className={`badge badge-priority-${priority}`}>{labels[priority]}</span>;
}

function ConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <h2>Delete task?</h2>
        <p>This action cannot be undone.</p>
        <div className="confirm-actions">
          <button className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button className="btn-confirm-delete" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { tasks, pagination, filters, loading, error, fetchTasks, deleteTask, setFilters, resetFilters } =
    useTaskStore();

  const [search, setSearch] = useState(filters.search ?? '');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editTarget, setEditTarget] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: search || undefined });
      fetchTasks({ search: search || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchTasks, setFilters]);

  function handleFilterChange(key: string, value: string) {
    const update = { [key]: value || undefined };
    setFilters(update);
    fetchTasks(update);
  }

  function handleSort(column: 'due_date' | 'priority' | 'created_at') {
    const newDir = filters.sort_by === column && filters.sort_dir === 'asc' ? 'desc' : 'asc';
    setFilters({ sort_by: column, sort_dir: newDir });
    fetchTasks({ sort_by: column, sort_dir: newDir });
  }

  function handlePageChange(page: number) {
    fetchTasks({ page });
  }

  async function handleDelete() {
    if (deleteTarget === null) return;
    await deleteTask(deleteTarget);
    setDeleteTarget(null);
  }

  function handleReset() {
    setSearch('');
    resetFilters();
    fetchTasks({ search: undefined, status: undefined, priority: undefined });
  }

  function sortIndicator(column: string) {
    if (filters.sort_by !== column) return null;
    return filters.sort_dir === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <div className="tasks-page">
      <div className="page-header">
        <h1>Tasks</h1>
        <button className="btn-new-task" onClick={() => setShowNewModal(true)}>
          + New Task
        </button>
      </div>

      <div className="tasks-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="filter-select"
          value={filters.status ?? ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          className="filter-select"
          value={filters.priority ?? ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button className="btn-reset" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="tasks-table-wrapper">
        {loading ? (
          <div className="state-container">
            <div className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="state-container">
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="state-container">
            <p style={{ fontWeight: 500, color: '#111' }}>No tasks found</p>
            <p>Create your first task to get started.</p>
          </div>
        ) : (
          <>
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th
                    className={filters.sort_by === 'priority' ? 'active-sort' : ''}
                    onClick={() => handleSort('priority')}
                  >
                    Priority{sortIndicator('priority')}
                  </th>
                  <th>Status</th>
                  <th
                    className={filters.sort_by === 'due_date' ? 'active-sort' : ''}
                    onClick={() => handleSort('due_date')}
                  >
                    Due Date{sortIndicator('due_date')}
                  </th>
                  <th>Tags</th>
                  <th
                    className={filters.sort_by === 'created_at' ? 'active-sort' : ''}
                    onClick={() => handleSort('created_at')}
                  >
                    Created{sortIndicator('created_at')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: Task) => (
                  <tr key={task.id}>
                    <td>
                      <Link to={`/tasks/${task.id}`} className="task-title-link">
                        {task.title}
                      </Link>
                    </td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : <span style={{ color: '#9ca3af' }}>—</span>}
                    </td>
                    <td>
                      {task.tags.length > 0 ? (
                        <div className="tags-list">
                          {task.tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td>{new Date(task.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-action btn-edit"
                          onClick={() => setEditTarget(task.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => setDeleteTarget(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.total_pages > 1 && (
              <div className="pagination">
                <span>
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn-page"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-page"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.total_pages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {deleteTarget !== null && (
        <ConfirmDialog
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showNewModal && (
        <TaskFormModal onClose={() => setShowNewModal(false)} />
      )}

      {editTarget !== null && (
        <TaskFormModal taskId={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </div>
  );
}
