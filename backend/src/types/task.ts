export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: Date | null;
  tags: string[];
  assigned_to: number | null;
  created_by: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
