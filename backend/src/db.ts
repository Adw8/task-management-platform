import { Pool } from 'pg';
import { requireEnv } from './utils/env';

const pool = new Pool({
  host: requireEnv('PGHOST'),
  port: Number(requireEnv('PGPORT')),
  user: requireEnv('PGUSER'),
  password: requireEnv('PGPASSWORD'),
  database: requireEnv('PGDATABASE'),
});

export default pool;
