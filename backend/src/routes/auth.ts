import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { authenticate } from '../middleware/auth';
import { requireEnv } from '../utils/env';

const router = Router();
const JWT_SECRET = requireEnv('JWT_SECRET');

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ error: 'name, email and password are required' });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: 'password must be at least 8 characters' });
    return;
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    res.status(409).json({ error: 'email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, passwordHash],
  );

  res.status(201).json(result.rows[0]);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const result = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email],
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'invalid credentials' });
    return;
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({ token });
});

router.get('/me', authenticate, async (_req, res) => {
  const userId = (res.locals['user'] as { sub?: string }).sub;
  if (!userId) {
    res.status(401).json({ error: 'invalid token payload' });
    return;
  }

  const result = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [userId],
  );

  if (result.rows.length === 0) {
    res.status(404).json({ error: 'user not found' });
    return;
  }

  res.json(result.rows[0]);
});

export default router;
