# task-management-platform

A full-stack task management system.

---

## Tech Stack

| Layer        | Technology                                          |
|--------------|-----------------------------------------------------|
| Frontend     | React 19, TypeScript, Vite, React Router v7         |
| Charts       | Recharts                                            |
| State        | Zustand                                             |
| Backend      | Node.js, Express 5, TypeScript                      |
| Database     | PostgreSQL (raw SQL via `node-postgres`)            |
| Migrations   | node-pg-migrate                                     |
| Auth         | JWT (jsonwebtoken), bcrypt                          |
| Validation   | Zod v4                                              |
| Security     | helmet, cors, express-rate-limit                    |
| File uploads | Multer (disk storage)                               |
| API Docs     | swagger-ui-express — served at `/api-docs`          |
| HTTP client  | Axios                                               |

---

## Project Structure

```
task-management-platform/
├── backend/
│   ├── src/
│   │   ├── middleware/        # auth.ts — JWT verification
│   │   ├── routes/            # auth, tasks, comments, files, analytics
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── utils/             # env.ts
│   │   ├── db.ts              # pg Pool
│   │   ├── openapi.ts         # OpenAPI 3.0 spec
│   │   └── index.ts           # Express app entry
│   ├── migrations/            # node-pg-migrate SQL migrations
│   ├── uploads/               # Multer file storage (gitignored)
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios client + per-resource functions
│   │   ├── components/        # Layout, ProtectedRoute, TaskFormModal, Comments, FileUpload
│   │   ├── hooks/             # useAuthInit
│   │   ├── pages/             # Dashboard, Tasks, TaskDetail, Analytics, Profile, Auth
│   │   ├── store/             # authStore, taskStore (Zustand)
│   │   ├── styles/            # Plain CSS per page/component
│   │   └── types/             # TypeScript interfaces
│   └── .env.example
│
└── README.md
```

---

## Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14

### Backend

```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run migrate up     # run migrations
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Production

```bash
# Backend — compile and run
cd backend
npm run build       # tsc → dist/
npm start           # node dist/index.js

# Frontend — build static assets
cd frontend
npm run build       # tsc + vite build → dist/
# Serve dist/ with any static file server (nginx, Caddy, etc.)
# Set VITE_API_URL to your backend's public URL before building
```

---

## Environment Variables

### `backend/.env`

```env
PGHOST=localhost
PGPORT=5433
PGUSER=postgres
PGPASSWORD=your_postgres_password
PGDATABASE=taskmanager

PORT=3000
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

---

## API Reference

Interactive docs available at `http://localhost:3000/api-docs` (Swagger UI) when the backend is running.

All routes except `/auth/register`, `/auth/login`, and `/health` require `Authorization: Bearer <token>`.

### Auth

| Method | Endpoint         | Description            |
|--------|------------------|------------------------|
| POST   | `/auth/register` | Register — returns JWT |
| POST   | `/auth/login`    | Login — returns JWT    |
| GET    | `/auth/me`       | Get current user       |

### Tasks

| Method | Endpoint        | Description                             |
|--------|-----------------|-----------------------------------------|
| GET    | `/tasks`        | List tasks (filter, search, sort, page) |
| POST   | `/tasks`        | Create task                             |
| POST   | `/tasks/bulk`   | Bulk create tasks (max 100)             |
| GET    | `/tasks/export` | Export tasks as CSV (status/priority/tags filters) |
| GET    | `/tasks/:id`    | Get task by ID                          |
| PUT    | `/tasks/:id`    | Update task (creator or assignee only)  |
| DELETE | `/tasks/:id`    | Soft delete task (creator only)         |

### Comments

| Method | Endpoint                              | Description                   |
|--------|---------------------------------------|-------------------------------|
| GET    | `/tasks/:taskId/comments`             | List comments                 |
| POST   | `/tasks/:taskId/comments`             | Add a comment                 |
| PUT    | `/tasks/:taskId/comments/:commentId`  | Edit comment (author only)    |
| DELETE | `/tasks/:taskId/comments/:commentId`  | Delete comment (author only)  |

### Files

| Method | Endpoint                            | Description                    |
|--------|-------------------------------------|--------------------------------|
| GET    | `/tasks/:taskId/files`              | List attached files            |
| POST   | `/tasks/:taskId/files`              | Upload files (max 10, 10 MB each) |
| GET    | `/tasks/:taskId/files/:fileId`      | Download a file                |
| DELETE | `/tasks/:taskId/files/:fileId`      | Delete file (uploader only)    |

### Analytics

| Method | Endpoint                | Description                                    |
|--------|-------------------------|------------------------------------------------|
| GET    | `/analytics/overview`   | Counts by status, priority, overdue + recent tasks |
| GET    | `/analytics/trends`     | Daily created/completed counts (last 30 days)  |

### GET /tasks — Query Parameters

| Param      | Type                              | Description           |
|------------|-----------------------------------|-----------------------|
| `status`   | `todo` \| `in_progress` \| `done` | Filter by status      |
| `priority` | `low` \| `medium` \| `high`       | Filter by priority    |
| `search`   | string                            | Full-text search      |
| `tags`     | string                            | Comma-separated tags  |
| `sort_by`  | `created_at` \| `due_date` \| `priority` | Sort column  |
| `sort_dir` | `asc` \| `desc`                   | Sort direction        |
| `page`     | number                            | Page number (default 1) |
| `limit`    | number                            | Page size (default 20, max 100) |

---

## Design Decisions

- **Raw SQL over ORM** — used `node-pg-migrate` + `node-postgres` directly. More verbose but gives full control over indexes and query shape.
- **Composite indexes** — `(created_by, status, created_at)` and `(assigned_to, status, created_at)` for common filtered list queries. Partial index on `deleted_at IS NULL`. GIN indexes for tag array containment and full-text search.
- **Soft deletes** — `deleted_at` column on tasks; all queries filter `WHERE deleted_at IS NULL`.
- **Authorization** — creator or assigned user can update a task; only the creator can delete it.
- **JWT in Authorization header** — simpler than httpOnly cookies for this scope.
- **Zustand over Redux** — less boilerplate, sufficient for auth state + task cache.
- **Token stored in localStorage** — acceptable for this scope; the 401 interceptor clears stale tokens automatically.
- **Rate limiting on /auth** — 10 requests per 15 minutes per IP to limit brute-force attempts.
- **Server-side CSV export** — `GET /tasks/export` streams CSV row-by-row from the database rather than building the full dataset client-side. Avoids loading all task data into browser memory and keeps the download logic out of the frontend bundle. The endpoint accepts `status`, `priority`, and `tags` filters. Search is intentionally excluded — exports are meant for bulk data extraction, not search result snapshots.

---

*Built with React, Express, PostgreSQL, and TypeScript.*
