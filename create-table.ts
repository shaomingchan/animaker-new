import postgres from 'postgres';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function createTable() {
  const sql = postgres(DATABASE_URL);

  try {
    const sqlScript = readFileSync('./create-video-task.sql', 'utf-8');

    console.log('Executing SQL script...');
    await sql.unsafe(sqlScript);

    console.log('✅ video_task table created successfully');

    // Verify
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'video_task'
    `;

    console.log('Verification:', result.length > 0 ? '✅ Table exists' : '❌ Table not found');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

createTable();
