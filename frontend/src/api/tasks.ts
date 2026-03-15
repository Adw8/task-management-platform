import client from './client';
import type { CreateTaskPayload, Task, TaskFilters, TasksResponse, UpdateTaskPayload } from '../types/task';

export async function getTasks(filters: TaskFilters = {}): Promise<TasksResponse> {
  const res = await client.get<TasksResponse>('/tasks', { params: filters });
  return res.data;
}

export async function getTask(id: number): Promise<Task> {
  const res = await client.get<Task>(`/tasks/${id}`);
  return res.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const res = await client.post<Task>('/tasks', payload);
  return res.data;
}

export async function updateTask(id: number, payload: UpdateTaskPayload): Promise<Task> {
  const res = await client.put<Task>(`/tasks/${id}`, payload);
  return res.data;
}

export async function deleteTask(id: number): Promise<void> {
  await client.delete(`/tasks/${id}`);
}

export async function bulkCreateTasks(tasks: CreateTaskPayload[]): Promise<Task[]> {
  const res = await client.post<Task[]>('/tasks/bulk', { tasks });
  return res.data;
}

export async function exportTasks(filters: Pick<TaskFilters, 'status' | 'priority' | 'tags'>): Promise<void> {
  const res = await client.get('/tasks/export', { params: filters, responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
