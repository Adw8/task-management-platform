import 'dotenv/config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRouter from './routes/auth';

const app = express();
const PORT = process.env['PORT'] ?? 3000;
const CLIENT_URL = process.env['CLIENT_URL'] ?? 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.socket.remoteAddress ?? '127.0.0.1',
  message: { error: 'too many requests, please try again later' },
});

app.get('/health', async (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authLimiter);
app.use('/auth', authRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
