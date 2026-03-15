import { create } from 'zustand';
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import type { Task, TaskFilters, CreateTaskPayload, UpdateTaskPayload } from '../types/task';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface TaskState {
  tasks: Task[];
  pagination: Pagination;
  filters: TaskFilters;
  loading: boolean;
  error: string | null;

  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task>;
  updateTask: (id: number, payload: UpdateTaskPayload) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: TaskFilters = {
  sort_by: 'created_at',
  sort_dir: 'desc',
  page: 1,
  limit: 20,
};

const DEFAULT_PAGINATION: Pagination = {
  total: 0,
  page: 1,
  limit: 20,
  total_pages: 0,
};

const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  pagination: DEFAULT_PAGINATION,
  filters: DEFAULT_FILTERS,
  loading: false,
  error: null,

  fetchTasks: async (filters?: TaskFilters) => {
    const merged = { ...get().filters, ...filters };
    set({ loading: true, error: null, filters: merged });
    try {
      const res = await getTasks(merged);
      set({ tasks: res.data, pagination: res.pagination, loading: false });
    } catch {
      set({ error: 'Failed to load tasks', loading: false });
    }
  },

  createTask: async (payload: CreateTaskPayload) => {
    const task = await createTask(payload);
    // Refresh the list to reflect the new task with correct pagination
    await get().fetchTasks();
    return task;
  },

  updateTask: async (id: number, payload: UpdateTaskPayload) => {
    const task = await updateTask(id, payload);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? task : t)),
    }));
    return task;
  },

  deleteTask: async (id: number) => {
    await deleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      pagination: {
        ...state.pagination,
        total: state.pagination.total - 1,
      },
    }));
  },

  setFilters: (filters: TaskFilters) => {
    // Reset to page 1 when filters change
    set((state) => ({ filters: { ...state.filters, ...filters, page: 1 } }));
  },

  resetFilters: () => {
    set({ filters: DEFAULT_FILTERS });
  },
}));

export default useTaskStore;
