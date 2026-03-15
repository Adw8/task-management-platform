import 'dotenv/config';
import bcrypt from 'bcrypt';
import pool from './db';

const SEED_TAG = '__seed__';

const USERS = [
  { name: 'Alice Johnson', email: 'alice@demo.com', password: 'password123' },
  { name: 'Bob Smith',     email: 'bob@demo.com',   password: 'password123' },
  { name: 'Carol White',   email: 'carol@demo.com', password: 'password123' },
];

const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

async function seed() {
  console.log('Seeding database...');

  // Create users
  const userIds: Record<string, number> = {};
  for (const u of USERS) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length > 0) {
      userIds[u.email] = existing.rows[0].id;
      console.log(`  User already exists: ${u.email}`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, 10);
    const res = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [u.name, u.email, hash],
    );
    userIds[u.email] = res.rows[0].id;
    console.log(`  Created user: ${u.email}`);
  }

  const [alice, bob, carol] = [userIds['alice@demo.com'], userIds['bob@demo.com'], userIds['carol@demo.com']];

  // Create tasks
  const tasks = [
    // Done
    { title: 'Set up project repository',      description: 'Initialise Git repo, add .gitignore and README.',  status: 'done',        priority: 'high',   due_date: daysFromNow(-10), tags: ['setup', SEED_TAG],           created_by: alice, assigned_to: alice },
    { title: 'Design database schema',          description: 'ERD for users, tasks, comments and files.',         status: 'done',        priority: 'high',   due_date: daysFromNow(-7),  tags: ['backend', SEED_TAG],         created_by: alice, assigned_to: bob   },
    { title: 'Implement user authentication',   description: 'JWT register, login and /auth/me endpoints.',      status: 'done',        priority: 'high',   due_date: daysFromNow(-5),  tags: ['backend', 'auth', SEED_TAG], created_by: bob,   assigned_to: bob   },
    { title: 'Build task CRUD API',             description: 'Create, read, update and soft-delete endpoints.',   status: 'done',        priority: 'high',   due_date: daysFromNow(-3),  tags: ['backend', SEED_TAG],         created_by: bob,   assigned_to: alice },
    { title: 'Write API documentation',         description: 'Document all endpoints with Swagger UI.',           status: 'done',        priority: 'medium', due_date: daysFromNow(-1),  tags: ['docs', SEED_TAG],            created_by: carol, assigned_to: carol },

    // In progress
    { title: 'Add file attachment support',     description: 'Drag-and-drop uploads, download and delete.',      status: 'in_progress', priority: 'medium', due_date: daysFromNow(2),   tags: ['frontend', SEED_TAG],        created_by: alice, assigned_to: alice },
    { title: 'Build analytics dashboard',       description: 'Charts for task trends and user performance.',      status: 'in_progress', priority: 'medium', due_date: daysFromNow(3),   tags: ['frontend', SEED_TAG],        created_by: bob,   assigned_to: carol },
    { title: 'Improve mobile responsiveness',   description: 'Fix layout issues on small screens.',               status: 'in_progress', priority: 'low',    due_date: daysFromNow(5),   tags: ['frontend', 'ux', SEED_TAG],  created_by: carol, assigned_to: bob   },

    // To do
    { title: 'Add dark mode',                   description: 'Support system preference and manual toggle.',      status: 'todo',        priority: 'low',    due_date: daysFromNow(7),   tags: ['frontend', 'ux', SEED_TAG],  created_by: alice, assigned_to: null  },
    { title: 'Write end-to-end tests',          description: 'Cover critical user flows with Playwright.',        status: 'todo',        priority: 'medium', due_date: daysFromNow(10),  tags: ['testing', SEED_TAG],         created_by: bob,   assigned_to: alice },
    { title: 'Set up CI/CD pipeline',           description: 'GitHub Actions for lint, build and deploy.',        status: 'todo',        priority: 'high',   due_date: daysFromNow(6),   tags: ['devops', SEED_TAG],          created_by: carol, assigned_to: carol },
    { title: 'Performance audit',               description: 'Lighthouse audit and bundle size optimisation.',    status: 'todo',        priority: 'low',    due_date: daysFromNow(14),  tags: ['performance', SEED_TAG],     created_by: alice, assigned_to: null  },

    // Overdue
    { title: 'Security review',                 description: 'Audit input sanitisation, CORS and rate limits.',   status: 'todo',        priority: 'high',   due_date: daysFromNow(-2),  tags: ['security', SEED_TAG],        created_by: bob,   assigned_to: bob   },
    { title: 'Migrate staging database',        description: 'Run migrations on staging before next release.',    status: 'in_progress', priority: 'high',   due_date: daysFromNow(-1),  tags: ['devops', SEED_TAG],          created_by: carol, assigned_to: alice },
  ];

  for (const t of tasks) {
    await pool.query(
      `INSERT INTO tasks (title, description, status, priority, due_date, tags, created_by, assigned_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [t.title, t.description, t.status, t.priority, t.due_date, t.tags, t.created_by, t.assigned_to],
    );
  }
  console.log(`  Created ${tasks.length} tasks`);

  console.log('\nSeed complete. Demo credentials:');
  for (const u of USERS) {
    console.log(`  ${u.email} / ${u.password}`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
