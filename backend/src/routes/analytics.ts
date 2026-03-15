import { Router } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/auth';
import type { Task } from '../types/task';

const router = Router();

router.use(authenticate);

// GET /analytics/overview
router.get('/overview', async (_req, res, next) => {
  try {
    const [countsResult, recentResult] = await Promise.all([
      pool.query<{
        total: string; todo: string; in_progress: string; done: string;
        overdue: string; low: string; medium: string; high: string;
      }>(
        `SELECT
          COUNT(*)                                                        AS total,
          COUNT(*) FILTER (WHERE status = 'todo')                        AS todo,
          COUNT(*) FILTER (WHERE status = 'in_progress')                 AS in_progress,
          COUNT(*) FILTER (WHERE status = 'done')                        AS done,
          COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done')  AS overdue,
          COUNT(*) FILTER (WHERE priority = 'low')                       AS low,
          COUNT(*) FILTER (WHERE priority = 'medium')                    AS medium,
          COUNT(*) FILTER (WHERE priority = 'high')                      AS high
        FROM tasks
        WHERE deleted_at IS NULL`
      ),
      pool.query<Task>(
        `SELECT id, title, status, priority, due_date, created_at
         FROM tasks
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT 5`
      ),
    ]);

    const row = countsResult.rows[0]!;

    res.json({
      total:       Number(row.total),
      by_status:   { todo: Number(row.todo), in_progress: Number(row.in_progress), done: Number(row.done) },
      by_priority: { low: Number(row.low), medium: Number(row.medium), high: Number(row.high) },
      overdue:     Number(row.overdue),
      recent_tasks: recentResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
