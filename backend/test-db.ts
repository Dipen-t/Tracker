import { Pool } from 'pg';
import { env } from './src/config/env';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query('SELECT 1 as result');
    console.log('Query successful:', res.rows);
  } catch (err) {
    console.error('Connection failed:', err);
  } finally {
    await pool.end();
  }
}
run();
