import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function initAuthConfig() {
  console.log('Initializing auth configuration...');

  const configs = [
    { name: 'email_auth_enabled', value: 'true' },
    { name: 'email_verification_enabled', value: 'false' },
    { name: 'google_auth_enabled', value: 'false' },
    { name: 'google_one_tap_enabled', value: 'false' },
  ];

  for (const config of configs) {
    try {
      // Check if exists
      const existing = await sql`
        SELECT * FROM config WHERE name = ${config.name}
      `;

      if (existing.length === 0) {
        // Insert if not exists
        await sql`
          INSERT INTO config (name, value)
          VALUES (${config.name}, ${config.value})
        `;
        console.log(`✅ Created: ${config.name} = ${config.value}`);
      } else {
        console.log(`⏭️  Already exists: ${config.name} = ${existing[0].value}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${config.name}:`, error.message);
    }
  }

  // Show all auth configs
  console.log('\n📋 Current auth configuration:');
  const allConfigs = await sql`
    SELECT name, value FROM config
    WHERE name LIKE '%auth%' OR name LIKE '%verification%'
    ORDER BY name
  `;
  console.table(allConfigs);

  await sql.end();
  console.log('\n✅ Done!');
}

initAuthConfig().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
