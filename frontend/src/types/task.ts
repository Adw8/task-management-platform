export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  tags: string[];
  assigned_to: number | null;
  created_by: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TasksResponse {
  data: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  tags?: string;
  search?: string;
  sort_by?: 'due_date' | 'priority' | 'created_at';
  sort_dir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
  assigned_to?: number;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;
