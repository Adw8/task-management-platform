import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { requireEnv } from '../utils/env';

const JWT_SECRET = requireEnv('JWT_SECRET');

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.locals['user'] = payload;
    next();
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
}
