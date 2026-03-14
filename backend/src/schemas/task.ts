import { z } from 'zod';

export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'done']);
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high']);

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  status: TaskStatusEnum.optional().default('todo'),
  priority: TaskPriorityEnum.optional().default('medium'),
  due_date: z.iso.datetime().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
  assigned_to: z.number().int().positive().optional(),
});

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).nullable().optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    due_date: z.iso.datetime().nullable().optional(),
    tags: z.array(z.string().min(1).max(50)).max(20).optional(),
    assigned_to: z.number().int().positive().nullable().optional(),
  })
  .strict();

export const BulkCreateTaskSchema = z.object({
  tasks: z.array(CreateTaskSchema).min(1).max(100),
});

export const ListTasksQuerySchema = z.object({
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  tags: z.string().optional(),
  search: z.string().max(200).optional(),
  sort_by: z.enum(['due_date', 'priority', 'created_at']).optional().default('created_at'),
  sort_dir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
