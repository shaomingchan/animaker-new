import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function checkTables() {
  console.log('📊 Checking database tables...\n');

  try {
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.table_name}`);
    });

    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

checkTables();
