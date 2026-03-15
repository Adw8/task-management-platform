import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import pool from '../db';
import { authenticate } from '../middleware/auth';
import {
  BulkCreateTaskSchema,
  CreateTaskSchema,
  ExportTasksQuerySchema,
  ListTasksQuerySchema,
  UpdateTaskSchema,
} from '../schemas/task';
import type { Task } from '../types/task';

const router = Router();

router.use(authenticate);

function getUserId(res: Response): number {
  const user = res.locals['user'] as { sub?: string };
  const id = Number(user.sub);
  if (!Number.isFinite(id)) throw new Error('invalid user context');
  return id;
}

// GET /tasks/export — must be declared before /:id routes
router.get('/export', async (req, res, next) => {
  const parsed = ExportTasksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: z.flattenError(parsed.error) });
    return;
  }

  const { status, priority, tags } = parsed.data;
  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let n = 1;

  if (status)   { conditions.push(`status = $${n++}`);   params.push(status); }
  if (priority) { conditions.push(`priority = $${n++}`); params.push(priority); }
  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) { conditions.push(`tags @> $${n++}::text[]`); params.push(tagList); }
  }

  try {
    const result = await pool.query<Task>(
      `SELECT id, title, status, priority, due_date, tags, description, created_at
       FROM tasks WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC`,
      params,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');

    res.write('ID,Title,Status,Priority,Due Date,Tags,Description,Created\n');
    for (const row of result.rows) {
      const cols = [
        row.id,
        csvEscape(row.title),
        row.status,
        row.priority,
        row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : '',
        csvEscape(row.tags.join(', ')),
        csvEscape(row.description ?? ''),
        new Date(row.created_at).toISOString().slice(0, 10),
      ];
      res.write(cols.join(',') + '\n');
    }
    res.end();
  } catch (err) {
    next(err);
  }
});

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// POST /tasks/bulk — must be declared before /:id routes
router.post('/bulk', async (req, res) => {
  const parsed = BulkCreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: z.flattenError(parsed.error) });
    return;
  }

  const createdBy = getUserId(res);
  const { tasks } = parsed.data;

  const values: unknown[] = [];
  const rowPlaceholders: string[] = [];
  let n = 1;

  for (const task of tasks) {
    rowPlaceholders.push(`($${n},$${n + 1},$${n + 2},$${n + 3},$${n + 4},$${n + 5},$${n + 6},$${n + 7})`);
    values.push(
      task.title,
      task.description ?? null,
      task.status,
      task.priority,
      task.due_date ?? null,
      task.tags,
      task.assigned_to ?? null,
      createdBy,
    );
    n += 8;
  }

  try {
    const result = await pool.query<Task>(
      `INSERT INTO tasks (title, description, status, priority, due_date, tags, assigned_to, created_by)
       VALUES ${rowPlaceholders.join(', ')}
       RETURNING *`,
      values,
    );
    res.status(201).json(result.rows);
  } catch {
    res.status(500).json({ error: 'internal server error' });
  }
});

// POST /tasks
router.post('/', async (req, res) => {
  const parsed = CreateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: z.flattenError(parsed.error) });
    return;
  }

  const { title, description, status, priority, due_date, tags, assigned_to } = parsed.data;
  const createdBy = getUserId(res);

  try {
    const result = await pool.query<Task>(
      `INSERT INTO tasks (title, description, status, priority, due_date, tags, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description ?? null, status, priority, due_date ?? null, tags, assigned_to ?? null, createdBy],
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'internal server error' });
  }
});

// GET /tasks
router.get('/', async (req, res) => {
  const parsed = ListTasksQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: z.flattenError(parsed.error) });
    return;
  }

  const { status, priority, tags, search, sort_by, sort_dir, page, limit } = parsed.data;

  const conditions: string[] = ['deleted_at IS NULL'];
  const params: unknown[] = [];
  let n = 1;

  if (status) {
    conditions.push(`status = $${n++}`);
    params.push(status);
  }

  if (priority) {
    conditions.push(`priority = $${n++}`);
    params.push(priority);
  }

  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      conditions.push(`tags @> $${n++}::text[]`);
      params.push(tagList);
    }
  }

  if (search) {
    conditions.push(
      `to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
       @@ plainto_tsquery('english', $${n++})`,
    );
    params.push(search);
  }

  const ORDER_MAP: Record<string, string> = {
    due_date: 'due_date',
    created_at: 'created_at',
    priority: `CASE priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END`,
  };
  const orderExpr = ORDER_MAP[sort_by];
  const direction = sort_dir === 'asc' ? 'ASC' : 'DESC';
  const whereClause = conditions.join(' AND ');
  const filterParams = [...params];

  params.push(limit);
  params.push((page - 1) * limit);
  const limitParam = n++;
  const offsetParam = n;

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query<Task>(
        `SELECT * FROM tasks
         WHERE ${whereClause}
         ORDER BY ${orderExpr} ${direction} NULLS LAST
         LIMIT $${limitParam} OFFSET $${offsetParam}`,
        params,
      ),
      pool.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM tasks WHERE ${whereClause}`,
        filterParams,
      ),
    ]);

    const total = Number(countResult.rows[0]?.count ?? 0);

    res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch {
    res.status(500).json({ error: 'internal server error' });
  }
});

// GET /tasks/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid task id' });
    return;
  }

  try {
    const result = await pool.query<Task>(
      'SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'task not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'internal server error' });
  }
});

// PUT /tasks/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid task id' });
    return;
  }

  const parsed = UpdateTaskSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: z.flattenError(parsed.error) });
    return;
  }

  const userId = getUserId(res);

  try {
    const existing = await pool.query<Task>(
      'SELECT * FROM tasks WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'task not found' });
      return;
    }

    const task = existing.rows[0];
    if (task.created_by !== userId && task.assigned_to !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const updates = parsed.data;
    const setClauses: string[] = ['updated_at = now()'];
    const params: unknown[] = [];
    let n = 1;

    const updateableFields = ['title', 'description', 'status', 'priority', 'due_date', 'tags', 'assigned_to'] as const;
    for (const field of updateableFields) {
      if (field in updates) {
        setClauses.push(`${field} = $${n++}`);
        params.push((updates as Record<string, unknown>)[field] ?? null);
      }
    }

    params.push(id);
    const result = await pool.query<Task>(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${n} RETURNING *`,
      params,
    );

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'internal server error' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req, res) => {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'invalid task id' });
    return;
  }

  const userId = getUserId(res);

  try {
    const existing = await pool.query<Pick<Task, 'created_by'>>(
      'SELECT created_by FROM tasks WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'task not found' });
      return;
    }

    if (existing.rows[0].created_by !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await pool.query(
      'UPDATE tasks SET deleted_at = now(), updated_at = now() WHERE id = $1',
      [id],
    );

    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'internal server error' });
  }
});

export default router;
