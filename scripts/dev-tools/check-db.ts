import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function checkTable() {
  const sql = postgres(DATABASE_URL);

  try {
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'video_task'
    `;

    console.log('video_task table exists:', result.length > 0);
    console.log('Result:', result);

    // List all tables
    const allTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\nAll tables in database:');
    allTables.forEach((row: any) => console.log('-', row.table_name));

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkTable();
