import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function createAllTables() {
  console.log('🔧 开始创建所有缺失的数据库表...\n');

  try {
    // 1. credit 表（积分系统）
    console.log('1️⃣ 创建 credit 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "credit" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "amount" integer NOT NULL,
        "type" text NOT NULL,
        "description" text,
        "order_id" text,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ credit 表创建成功');

    // 2. subscription 表
    console.log('\n2️⃣ 创建 subscription 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "subscription" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "plan_id" text NOT NULL,
        "status" text NOT NULL,
        "current_period_start" timestamp,
        "current_period_end" timestamp,
        "cancel_at_period_end" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ subscription 表创建成功');

    // 3. taxonomy 表
    console.log('\n3️⃣ 创建 taxonomy 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "taxonomy" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "type" text NOT NULL,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ taxonomy 表创建成功');

    // 4. post 表
    console.log('\n4️⃣ 创建 post 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "post" (
        "id" text PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "content" text,
        "excerpt" text,
        "author_id" text NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "published_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ post 表创建成功');

    // 5. apikey 表
    console.log('\n5️⃣ 创建 apikey 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "apikey" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "key" text NOT NULL UNIQUE,
        "name" text,
        "last_used_at" timestamp,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ apikey 表创建成功');

    // 6. role 表
    console.log('\n6️⃣ 创建 role 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "role" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL UNIQUE,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ role 表创建成功');

    // 7. permission 表
    console.log('\n7️⃣ 创建 permission 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "permission" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL UNIQUE,
        "description" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ permission 表创建成功');

    // 8. rolePermission 表
    console.log('\n8️⃣ 创建 rolePermission 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "rolePermission" (
        "role_id" text NOT NULL,
        "permission_id" text NOT NULL,
        PRIMARY KEY ("role_id", "permission_id")
      );
    `;
    console.log('   ✅ rolePermission 表创建成功');

    // 9. userRole 表
    console.log('\n9️⃣ 创建 userRole 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "userRole" (
        "user_id" text NOT NULL,
        "role_id" text NOT NULL,
        PRIMARY KEY ("user_id", "role_id")
      );
    `;
    console.log('   ✅ userRole 表创建成功');

    // 10. ai_task 表
    console.log('\n🔟 创建 ai_task 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "ai_task" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "type" text NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "input" text,
        "output" text,
        "error_message" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ ai_task 表创建成功');

    // 11. chat 表
    console.log('\n1️⃣1️⃣ 创建 chat 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "chat" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "title" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ chat 表创建成功');

    // 12. chatMessage 表
    console.log('\n1️⃣2️⃣ 创建 chatMessage 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "chatMessage" (
        "id" text PRIMARY KEY NOT NULL,
        "chat_id" text NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('   ✅ chatMessage 表创建成功');

    // 列出所有表
    console.log('\n📊 当前数据库中的所有表:');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    tables.forEach(t => console.log(`   - ${t.table_name}`));

    console.log('\n✅ 所有数据库表创建完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  } finally {
    await sql.end();
  }
}

createAllTables();
