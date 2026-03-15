import 'dotenv/config';
import pool from './db';

async function unseed() {
  console.log('Removing seed data...');

  const { rowCount: tasks } = await pool.query(
    `DELETE FROM tasks WHERE '__seed__' = ANY(tags)`,
  );
  console.log(`  Deleted ${tasks} tasks`);

  const seedEmails = ['alice@demo.com', 'bob@demo.com', 'carol@demo.com'];
  const { rowCount: users } = await pool.query(
    'DELETE FROM users WHERE email = ANY($1)',
    [seedEmails],
  );
  console.log(`  Deleted ${users} users`);

  await pool.end();
  console.log('Done.');
}

unseed().catch((err) => {
  console.error('Unseed failed:', err);
  process.exit(1);
});
