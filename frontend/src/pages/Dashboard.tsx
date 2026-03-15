import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOverview, type OverviewStats } from '../api/analytics';
import useAuthStore from '../store/authStore';
import type { TaskPriority, TaskStatus } from '../types/task';
import '../styles/dashboard.css';

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  accent: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon--${accent}`}>{icon}</div>
      <div className="stat-body">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

interface ProgressRowProps {
  label: string;
  value: number;
  total: number;
  accent: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

function ProgressRow({ label, value, total, accent }: ProgressRowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="progress-row">
      <span className="progress-label">{label}</span>
      <div className="progress-track">
        <div
          className={`progress-fill progress-fill--${accent}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="progress-count">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOverview()
      .then(setStats)
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">Loading...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">{error || 'Failed to load dashboard'}</div>
      </div>
    );
  }

  const completionRate = stats.total > 0
    ? Math.round((stats.by_status.done / stats.total) * 100)
    : 0;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {firstName}</h1>
          <p className="dashboard-subtitle">Here's what's happening with your tasks today.</p>
        </div>
        <button className="btn-new-task" onClick={() => navigate('/tasks')}>
          View Tasks
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <StatCard icon="📋" label="Total"       value={stats.total}                  accent="blue"   />
        <StatCard icon="⬜" label="To Do"        value={stats.by_status.todo}          accent="gray"   />
        <StatCard icon="⚡" label="In Progress"  value={stats.by_status.in_progress}   accent="yellow" />
        <StatCard icon="✅" label="Done"         value={stats.by_status.done}          accent="green"  />
        <StatCard icon="⚠️" label="Overdue"      value={stats.overdue}                 accent="red"    />
      </div>

      <div className="dashboard-grid">
        {/* By Status */}
        <div className="dashboard-card">
          <h2>By Status</h2>
          <div className="progress-list">
            <ProgressRow label="To Do"       value={stats.by_status.todo}        total={stats.total} accent="gray"   />
            <ProgressRow label="In Progress" value={stats.by_status.in_progress} total={stats.total} accent="yellow" />
            <ProgressRow label="Done"        value={stats.by_status.done}        total={stats.total} accent="green"  />
          </div>
          <div className="completion-rate">
            <span>{completionRate}% completion rate</span>
          </div>
        </div>

        {/* By Priority */}
        <div className="dashboard-card">
          <h2>By Priority</h2>
          <div className="progress-list">
            <ProgressRow label="High"   value={stats.by_priority.high}   total={stats.total} accent="red"    />
            <ProgressRow label="Medium" value={stats.by_priority.medium} total={stats.total} accent="yellow" />
            <ProgressRow label="Low"    value={stats.by_priority.low}    total={stats.total} accent="gray"   />
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Recent Tasks</h2>
          <Link to="/tasks" className="card-link">View all →</Link>
        </div>
        {stats.recent_tasks.length === 0 ? (
          <div className="recent-empty">
            <p>No tasks yet.</p>
            <Link to="/tasks" className="card-link">Create your first task</Link>
          </div>
        ) : (
          <table className="recent-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_tasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                return (
                  <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} className="recent-row">
                    <td className="recent-title">{task.title}</td>
                    <td><span className={`badge badge-status-${task.status}`}>{STATUS_LABEL[task.status]}</span></td>
                    <td><span className={`badge badge-priority-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span></td>
                    <td className={isOverdue ? 'overdue-date' : ''}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
