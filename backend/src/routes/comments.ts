import { Router } from 'express';
import { z } from 'zod';
import pool from '../db';
import { authenticate } from '../middleware/auth';
import { sanitize } from '../utils/sanitize';

const router = Router({ mergeParams: true });

router.use(authenticate);

function getUserId(res: any): number {
  const id = Number((res.locals['user'] as { sub?: string }).sub);
  if (!Number.isFinite(id)) throw new Error('invalid user context');
  return id;
}

const CommentBodySchema = z.object({
  body: z.string().min(1).max(5000).transform(sanitize),
});

// GET /tasks/:taskId/comments
router.get('/', async (req, res, next) => {
  try {
    const taskId = Number((req.params as Record<string, string>)['taskId']);
    const { rows } = await pool.query(
      `SELECT c.id, c.body, c.created_at, c.updated_at,
              u.id AS user_id, u.name AS user_name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /tasks/:taskId/comments
router.post('/', async (req, res, next) => {
  try {
    const parsed = CommentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const taskId = Number((req.params as Record<string, string>)['taskId']);
    const userId = getUserId(res);

    const { rows } = await pool.query(
      `INSERT INTO comments (task_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, body, created_at, updated_at`,
      [taskId, userId, parsed.data.body]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:taskId/comments/:commentId
router.put('/:commentId', async (req, res, next) => {
  try {
    const parsed = CommentBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.flattenError(parsed.error) });
      return;
    }

    const commentId = Number(req.params['commentId']);
    const userId = getUserId(res);

    const existing = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [commentId]
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'comment not found' });
      return;
    }
    if (existing.rows[0].user_id !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { rows } = await pool.query(
      `UPDATE comments SET body = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, body, created_at, updated_at`,
      [parsed.data.body, commentId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:taskId/comments/:commentId
router.delete('/:commentId', async (req, res, next) => {
  try {
    const commentId = Number(req.params['commentId']);
    const userId = getUserId(res);

    const existing = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [commentId]
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'comment not found' });
      return;
    }
    if (existing.rows[0].user_id !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
