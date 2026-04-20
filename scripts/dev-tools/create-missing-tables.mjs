import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL);

async function createMissingTables() {
  console.log('🔧 开始创建缺失的数据库表...\n');

  try {
    // 1. 创建 config 表
    console.log('1️⃣ 创建 config 表...');
    await sql`
      CREATE TABLE IF NOT EXISTS "config" (
        "name" text PRIMARY KEY NOT NULL,
        "value" text NOT NULL
      );
    `;
    console.log('   ✅ config 表创建成功');

    // 2. 检查 video_task 表是否存在
    console.log('\n2️⃣ 检查 video_task 表...');
    const videoTaskExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'video_task'
      );
    `;

    if (!videoTaskExists[0].exists) {
      console.log('   创建 video_task 表...');
      await sql`
        CREATE TABLE "video_task" (
          "id" text PRIMARY KEY NOT NULL,
          "user_id" text NOT NULL,
          "photo_url" text NOT NULL,
          "video_url" text NOT NULL,
          "result_url" text,
          "status" text DEFAULT 'pending' NOT NULL,
          "error_message" text,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        );
      `;
      console.log('   ✅ video_task 表创建成功');
    } else {
      console.log('   ✅ video_task 表已存在');
    }

    // 3. 列出所有表
    console.log('\n3️⃣ 当前数据库中的所有表:');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    tables.forEach(t => console.log(`   - ${t.table_name}`));

    console.log('\n✅ 数据库表创建完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await sql.end();
  }
}

createMissingTables();
