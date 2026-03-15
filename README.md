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

- **Raw SQL over ORM** — used `node-pg-migrate` + `node-postgres` directly. More verbose but gives full control over indexes and query shape.
- **Composite indexes** — `(created_by, status, created_at)` and `(assigned_to, status, created_at)` for common filtered list queries. Partial index on `deleted_at IS NULL`. GIN indexes for tag array containment and full-text search.
- **Soft deletes** — `deleted_at` column on tasks; all queries filter `WHERE deleted_at IS NULL`.
- **Authorization** — creator or assigned user can update a task; only the creator can delete it.
- **JWT in Authorization header** — simpler than httpOnly cookies for this scope.
- **User list cached in Zustand** — `GET /users` is fetched once on first access and reused across `TaskFormModal`, `TaskDetail`, and the task list. Avoids redundant requests on every mount without adding a data-fetching library.
- **Zustand over Redux** — less boilerplate, sufficient for auth state + task cache.
- **Token stored in localStorage** — acceptable for this scope; the 401 interceptor clears stale tokens automatically.
- **Rate limiting on /auth** — 10 requests per 15 minutes per IP to limit brute-force attempts.
- **Shared workspace model** — all authenticated users see all tasks, consistent with the assignment spec. Tasks are not scoped per user; `assigned_to` indicates responsibility but does not restrict visibility.
- **Server-side CSV export** — `GET /tasks/export` streams CSV row-by-row from the database rather than building the full dataset client-side. Avoids loading all task data into browser memory and keeps the download logic out of the frontend bundle. The endpoint accepts `status`, `priority`, and `tags` filters. Search is intentionally excluded — exports are meant for bulk data extraction, not search result snapshots.

---

*Built with React, Express, PostgreSQL, and TypeScript.*
