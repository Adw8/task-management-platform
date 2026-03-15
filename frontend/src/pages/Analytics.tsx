import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { getOverview, getPerformance, getTrends, type OverviewStats, type TrendsData, type UserPerformance } from '../api/analytics';
import '../styles/analytics.css';

export default function Analytics() {
  const [overview, setOverview]       = useState<OverviewStats | null>(null);
  const [trends, setTrends]           = useState<TrendsData | null>(null);
  const [performance, setPerformance] = useState<UserPerformance[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    Promise.all([getOverview(), getTrends(), getPerformance()])
      .then(([ov, tr, perf]) => { setOverview(ov); setTrends(tr); setPerformance(perf); })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  // Merge created + completed series into unified timeline
  const trendData = useMemo(() => {
    if (!trends) return [];

    const map: Record<string, { isoDate: string; date: string; created: number; completed: number }> = {};

    trends.created.forEach(({ date, count }) => {
      map[date] = { isoDate: date, date: fmtDate(date), created: count, completed: 0 };
    });
    trends.completed.forEach(({ date, count }) => {
      if (map[date]) map[date].completed = count;
      else map[date] = { isoDate: date, date: fmtDate(date), created: 0, completed: count };
    });

    return Object.values(map)
      .sort((a, b) => a.isoDate.localeCompare(b.isoDate))
      .map(({ date, created, completed }) => ({ date, created, completed }));
  }, [trends]);

  // Bar chart data — tasks by status
  const statusData = overview
    ? [
        { name: 'To Do',       value: overview.by_status.todo,        fill: '#9ca3af' },
        { name: 'In Progress', value: overview.by_status.in_progress,  fill: '#2563eb' },
        { name: 'Done',        value: overview.by_status.done,         fill: '#16a34a' },
      ]
    : [];

  const priorityData = overview
    ? [
        { name: 'Low',    value: overview.by_priority.low,    fill: '#9ca3af' },
        { name: 'Medium', value: overview.by_priority.medium, fill: '#d97706' },
        { name: 'High',   value: overview.by_priority.high,   fill: '#dc2626' },
      ]
    : [];

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">Loading...</div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">{error || 'Failed to load analytics'}</div>
      </div>
    );
  }

  const completionRate = overview.total > 0
    ? Math.round((overview.by_status.done / overview.total) * 100)
    : 0;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Analytics</h1>
        <p className="analytics-subtitle">Task trends and breakdown for your workspace</p>
      </div>

      {/* Summary row */}
      <div className="analytics-summary">
        <div className="summary-item">
          <span className="summary-value">{overview.total}</span>
          <span className="summary-label">Total Tasks</span>
        </div>
        <div className="summary-item">
          <span className="summary-value summary-value--green">{completionRate}%</span>
          <span className="summary-label">Completion Rate</span>
        </div>
        <div className="summary-item">
          <span className="summary-value summary-value--red">{overview.overdue}</span>
          <span className="summary-label">Overdue</span>
        </div>
        <div className="summary-item">
          <span className="summary-value summary-value--blue">{overview.by_status.in_progress}</span>
          <span className="summary-label">In Progress</span>
        </div>
      </div>

      {/* Trend line chart */}
      <div className="analytics-card">
        <h2>Activity — last 30 days</h2>
        {trendData.length === 0 ? (
          <p className="chart-empty">No activity in the last 30 days.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="created"   name="Created"   stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="completed" name="Completed" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bar charts */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h2>By Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="analytics-card">
          <h2>By Priority</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* User performance */}
      {performance.length > 0 && (
        <div className="analytics-card">
          <h2>User Performance</h2>
          <table className="perf-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Total</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((u) => {
                const rate = u.total > 0 ? Math.round((u.done / u.total) * 100) : 0;
                return (
                  <tr key={u.user_id}>
                    <td className="perf-name">{u.user_name}</td>
                    <td>{u.total}</td>
                    <td className="perf-done">{u.done}</td>
                    <td>{u.in_progress}</td>
                    <td>
                      <div className="perf-rate-row">
                        <div className="perf-track">
                          <div className="perf-fill" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="perf-pct">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmtDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
