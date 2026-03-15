import client from './client';
import type { Task } from '../types/task';

export interface OverviewStats {
  total: number;
  by_status: { todo: number; in_progress: number; done: number };
  by_priority: { low: number; medium: number; high: number };
  overdue: number;
  recent_tasks: Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'due_date' | 'created_at'>[];
}

export async function getOverview(): Promise<OverviewStats> {
  const res = await client.get<OverviewStats>('/analytics/overview');
  return res.data;
}

export interface TrendPoint { date: string; count: number; }
export interface TrendsData {
  created:   TrendPoint[];
  completed: TrendPoint[];
}

export async function getTrends(): Promise<TrendsData> {
  const res = await client.get<TrendsData>('/analytics/trends');
  return res.data;
}
