import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

async function checkTables() {
  try {
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n✅ Database tables:');
    tables.rows.forEach((t: any) => console.log(`  - ${t.table_name}`));

    // Check if video_task exists
    const videoTaskExists = tables.rows.some((t: any) => t.table_name === 'video_task');
    const aiTaskExists = tables.rows.some((t: any) => t.table_name === 'ai_task');

    console.log('\n📊 Status:');
    console.log(`  video_task: ${videoTaskExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`  ai_task: ${aiTaskExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkTables();
