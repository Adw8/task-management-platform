import 'dotenv/config';
import { Pool } from 'pg';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

const pool = new Pool({
  host: requireEnv('PGHOST'),
  port: Number(requireEnv('PGPORT')),
  user: requireEnv('PGUSER'),
  password: requireEnv('PGPASSWORD'),
  database: requireEnv('PGDATABASE'),
});

export default pool;
