import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function resetDatabase() {
  console.log('🗑️  Dropping all tables...');

  try {
    // Drop all tables in correct order (respecting foreign keys)
    const tables = [
      'chat_message',
      'chat',
      'ai_task',
      'user_role',
      'role_permission',
      'permission',
      'role',
      'apikey',
      'post',
      'taxonomy',
      'subscription',
      'credit',
      'order',
      'video_task',
      'verification',
      'account',
      'session',
      'user',
      'config',
    ];

    for (const table of tables) {
      try {
        await sql.unsafe(`DROP TABLE IF EXISTS "${table}" CASCADE`);
        console.log(`  ✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`  ⏭️  Table ${table} doesn't exist or already dropped`);
      }
    }

    console.log('\n✅ All tables dropped successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run: npm run db:push');
    console.log('  2. Run: node init-auth-config.mjs');
    console.log('  3. Run: npm run dev');
    console.log('  4. Test registration at http://localhost:3000/sign-up');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetDatabase();
