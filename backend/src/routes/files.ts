import path from 'path';
import fs from 'fs';
import { Router } from 'express';
import multer from 'multer';
import pool from '../db';
import { authenticate } from '../middleware/auth';

const UPLOAD_DIR = process.env['UPLOAD_DIR'] ?? path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

const router = Router({ mergeParams: true });

router.use(authenticate);

function getUserId(res: any): number {
  const id = Number((res.locals['user'] as { sub?: string }).sub);
  if (!Number.isFinite(id)) throw new Error('invalid user context');
  return id;
}

// POST /tasks/:taskId/files
router.post('/', upload.array('files', 10), async (req, res, next) => {
  try {
    const taskId = Number((req.params as Record<string, string>)['taskId']);
    const userId = getUserId(res);
    const uploadedFiles = req.files as Express.Multer.File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      res.status(400).json({ error: 'no files uploaded' });
      return;
    }

    const inserted = await Promise.all(
      uploadedFiles.map((file) =>
        pool.query(
          `INSERT INTO files (task_id, uploaded_by, filename, original_name, mime_type, size)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, original_name, mime_type, size, created_at`,
          [taskId, userId, file.filename, file.originalname, file.mimetype, file.size]
        )
      )
    );

    res.status(201).json(inserted.map((r) => r.rows[0]));
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:taskId/files — list files for a task
router.get('/', async (req, res, next) => {
  try {
    const taskId = Number((req.params as Record<string, string>)['taskId']);
    const { rows } = await pool.query(
      `SELECT f.id, f.original_name, f.mime_type, f.size, f.created_at, u.name AS uploaded_by
       FROM files f
       JOIN users u ON u.id = f.uploaded_by
       WHERE f.task_id = $1
       ORDER BY f.created_at ASC`,
      [taskId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /files/:fileId — download a file
router.get('/:fileId', async (req, res, next) => {
  try {
    const fileId = Number(req.params['fileId']);
    const { rows } = await pool.query(
      'SELECT filename, original_name, mime_type FROM files WHERE id = $1',
      [fileId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'file not found' });
      return;
    }

    const file = rows[0];
    const filePath = path.join(UPLOAD_DIR, file.filename);

    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:taskId/files/:fileId
router.delete('/:fileId', async (req, res, next) => {
  try {
    const fileId = Number(req.params['fileId']);
    const userId = getUserId(res);

    const { rows } = await pool.query(
      'SELECT filename, uploaded_by FROM files WHERE id = $1',
      [fileId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'file not found' });
      return;
    }
    if (rows[0].uploaded_by !== userId) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await pool.query('DELETE FROM files WHERE id = $1', [fileId]);

    const filePath = path.join(UPLOAD_DIR, rows[0].filename);
    fs.unlink(filePath, () => {}); // best-effort cleanup

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
