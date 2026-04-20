import { db } from './src/config/db/client';
import { sql } from 'drizzle-orm';

async function checkTables() {
  const dbInstance = db();
  
  // 查询所有表
  const tables = await dbInstance.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  
  console.log('现有表：');
  console.log(tables.rows);
  
  // 检查 tasks 表结构
  const tasksColumns = await dbInstance.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  
  console.log('\ntasks 表结构：');
  console.log(tasksColumns.rows);
  
  process.exit(0);
}

checkTables().catch(console.error);
