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

## Demo

Run the seed script after the backend is started to populate the database with 3 users and 14 tasks across all statuses and priorities.

**Local**
```bash
cd backend
npm run seed
```

**Docker**
```bash
docker compose exec backend node dist/seed.js
```

### Demo credentials

| Name         | Email            | Password    |
|--------------|------------------|-------------|
| Alice Johnson | alice@demo.com  | password123 |
| Bob Smith     | bob@demo.com    | password123 |
| Carol White   | carol@demo.com  | password123 |

To remove seed data:
```bash
# Local
npm run unseed

# Docker
docker compose exec backend node dist/unseed.js
```

---

## Setup

### Prerequisites
- Node.js ≥ 22
- PostgreSQL ≥ 14
- Docker ≥ 24 (for Docker setup)

### Backend

```bash
cd backend
cp .env.example .env   # fill in values
npm install
npm run migrate:up     # run migrations
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Docker

```bash
# Copy and fill in env vars
cp backend/.env.example backend/.env

# Build and start all services (postgres, backend, frontend)
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- API docs: `http://localhost:3000/api-docs`

Migrations run automatically on backend startup. The `uploads` volume persists file attachments across restarts.

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

### Users

| Method | Endpoint  | Description       |
|--------|-----------|-------------------|
| GET    | `/users`  | List all users    |

### Analytics

| Method | Endpoint                | Description                                    |
|--------|-------------------------|------------------------------------------------|
| GET    | `/analytics/overview`     | Counts by status, priority, overdue + recent tasks  |
| GET    | `/analytics/performance`  | Per-user task counts and completion rates           |
| GET    | `/analytics/trends`       | Daily created/completed counts (last 30 days)       |

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

### Database

- **Raw SQL over ORM** — `node-pg-migrate` + `node-postgres` for full control over indexes and query shape.
- **Composite indexes** — `(created_by, status, created_at)` and `(assigned_to, status, created_at)` for filtered list queries. Partial index on `deleted_at IS NULL`. GIN indexes for tag containment and full-text search.
- **Tags as a PG array** — `text[]` with a GIN index rather than a join table.
- **Soft deletes** — `deleted_at` column; all queries filter `WHERE deleted_at IS NULL`.
- **Offset pagination** — simple `page`/`limit`; tradeoff is inconsistency under concurrent writes.
- **Migrations run on startup** — convenient for single-instance deployments; multi-instance prod would need a separate migration step.

### Auth & Security

- **JWT in Authorization header** — stateless, no session store. Token stored in localStorage; 401 interceptor clears stale tokens automatically.
- **No refresh tokens** — long-lived access tokens; acceptable for this scope.
- **Rate limiting on `/auth`** — 10 requests per 15 minutes per IP.

### Authorization & Access Control

- **Update/delete rules** — creator or assignee can update; only creator can delete.
- **Shared workspace** — all authenticated users see all tasks; `assigned_to` indicates responsibility but does not restrict visibility.

### Frontend State

- **Zustand over Redux** — less boilerplate, sufficient for auth state and task cache.
- **User list cached in Zustand** — `GET /users` fetched once on first access, reused across components to avoid redundant requests.

### API & Files

- **Server-side CSV export** — `GET /tasks/export` streams rows directly from the database. Accepts `status`, `priority`, and `tags` filters; search excluded since exports are for bulk extraction.
- **Disk file storage** — Multer stores files on the local filesystem; would need object storage (e.g. S3) for horizontal scaling.
- **No real-time updates** — pull-only; no WebSocket or polling.

---

*Built with React, Express, PostgreSQL, and TypeScript.*
