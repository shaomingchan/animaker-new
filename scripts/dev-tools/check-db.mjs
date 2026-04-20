import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';

const connectionString = 'postgresql://neondb_owner:npg_rIzBM6Uh3jvp@ep-quiet-mode-aiw1p876-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const client = neon(connectionString);
const db = drizzle(client);

// 查询所有表
const tables = await db.execute(sql`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name;
`);

console.log('现有表：');
tables.rows.forEach(row => console.log('  -', row.table_name));

// 检查是否有 tasks 表
const hasTasks = tables.rows.some(row => row.table_name === 'tasks');
console.log('\n是否存在 tasks 表:', hasTasks);

// 检查是否有 video_task 表
const hasVideoTask = tables.rows.some(row => row.table_name === 'video_task');
console.log('是否存在 video_task 表:', hasVideoTask);

process.exit(0);
