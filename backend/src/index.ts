import 'dotenv/config';
import express from 'express';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(express.json());

app.get('/health', async (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/users', usersRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
