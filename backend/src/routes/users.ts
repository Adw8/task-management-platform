import { Router } from 'express';
import pool from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /users
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email FROM users ORDER BY name ASC',
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
