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

// GET /analytics/performance
router.get('/performance', async (_req, res, next) => {
  try {
    const { rows } = await pool.query<{
      user_id: number;
      user_name: string;
      total: string;
      done: string;
      in_progress: string;
    }>(
      `SELECT
         u.id         AS user_id,
         u.name       AS user_name,
         COUNT(t.id)                                        AS total,
         COUNT(t.id) FILTER (WHERE t.status = 'done')      AS done,
         COUNT(t.id) FILTER (WHERE t.status = 'in_progress') AS in_progress
       FROM users u
       LEFT JOIN tasks t
         ON (t.assigned_to = u.id OR t.created_by = u.id)
         AND t.deleted_at IS NULL
       GROUP BY u.id, u.name
       ORDER BY done DESC, total DESC`
    );

    res.json(
      rows.map((r) => ({
        user_id:     r.user_id,
        user_name:   r.user_name,
        total:       Number(r.total),
        done:        Number(r.done),
        in_progress: Number(r.in_progress),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// GET /analytics/trends
router.get('/trends', async (_req, res, next) => {
  try {
    const [createdResult, completedResult] = await Promise.all([
      pool.query<{ date: string; count: string }>(
        `SELECT DATE(created_at)::text AS date, COUNT(*) AS count
         FROM tasks
         WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(created_at)
         ORDER BY date ASC`
      ),
      pool.query<{ date: string; count: string }>(
        `SELECT DATE(updated_at)::text AS date, COUNT(*) AS count
         FROM tasks
         WHERE deleted_at IS NULL AND status = 'done' AND updated_at >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(updated_at)
         ORDER BY date ASC`
      ),
    ]);

    res.json({
      created:   createdResult.rows.map((r) => ({ date: r.date, count: Number(r.count) })),
      completed: completedResult.rows.map((r) => ({ date: r.date, count: Number(r.count) })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
