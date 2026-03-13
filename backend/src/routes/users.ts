import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email } = req.body as { name: string; email: string };

  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }

  const result = await pool.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email],
  );

  res.status(201).json(result.rows[0]);
});

export default router;
