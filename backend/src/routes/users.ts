import bcrypt from 'bcrypt';
import { Router } from 'express';
import pool from '../db';

const router = Router();

router.post('/', async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email and password are required' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, passwordHash],
  );

  res.status(201).json(result.rows[0]);
});

export default router;
