import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function createTables() {
  console.log('🔨 Creating database tables...\n');

  try {
    // Create user table
    await sql`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" text PRIMARY KEY,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" boolean DEFAULT false NOT NULL,
        "image" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "utm_source" text DEFAULT '' NOT NULL,
        "ip" text DEFAULT '' NOT NULL,
        "locale" text DEFAULT '' NOT NULL
      )
    `;
    console.log('✅ Created: user');

    // Create session table
    await sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text PRIMARY KEY,
        "expires_at" timestamp NOT NULL,
        "token" text NOT NULL UNIQUE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      )
    `;
    console.log('✅ Created: session');

    // Create account table
    await sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" text PRIMARY KEY,
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" timestamp,
        "refresh_token_expires_at" timestamp,
        "scope" text,
        "password" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ Created: account');

    // Create verification table
    await sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        "id" text PRIMARY KEY,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ Created: verification');

    // Create config table
    await sql`
      CREATE TABLE IF NOT EXISTS "config" (
        "name" text UNIQUE NOT NULL,
        "value" text
      )
    `;
    console.log('✅ Created: config');

    // Create credit table
    await sql`
      CREATE TABLE IF NOT EXISTS "credit" (
        "id" text PRIMARY KEY,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "user_email" text,
        "order_no" text,
        "subscription_no" text,
        "transaction_no" text UNIQUE NOT NULL,
        "transaction_type" text NOT NULL,
        "transaction_scene" text,
        "credits" integer NOT NULL,
        "remaining_credits" integer DEFAULT 0 NOT NULL,
        "description" text,
        "expires_at" timestamp,
        "status" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "deleted_at" timestamp,
        "consumed_detail" text,
        "metadata" text
      )
    `;
    console.log('✅ Created: credit');

    console.log('\n✅ All tables created successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Run: node init-auth-config.mjs');
    console.log('  2. Run: npm run dev');
    console.log('  3. Test registration at http://localhost:3000/sign-up');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createTables();
