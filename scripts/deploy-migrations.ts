import { PrismaClient } from '@prisma/client';

async function deployMigrations() {
  // Use connection directly without pooler for migrations
  const directUrl = 'postgresql://postgres.rvppxdhrahcwiwrrwwaz:Jupiara2025@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

  const prisma = new PrismaClient({
    datasources: {
      db: { url: directUrl }
    }
  });

  try {
    console.log('🔍 Testing connection...');
    await prisma.$connect();

    console.log('✅ Connected to database');

    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);

    // Check all schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
      ORDER BY schema_name;
    `;

    console.log('📂 Available schemas:', schemas);

    // Check tables in each schema
    for (const schema of schemas as any[]) {
      const schemaName = schema.schema_name;
      console.log(`\n🔍 Schema: ${schemaName}`);

      const tables = await prisma.$queryRaw`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = ${schemaName}
        ORDER BY table_name;
      `;

      console.log(`  📋 Tables (${Array.isArray(tables) ? tables.length : 0}):`,
        Array.isArray(tables) && tables.length > 0
          ? tables.map((t: any) => t.table_name).slice(0, 10).join(', ') + (tables.length > 10 ? '...' : '')
          : 'No tables'
      );
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deployMigrations();