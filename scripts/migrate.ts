import { PrismaClient as SqliteClient } from '../src/generated/sqlite-client';
import { PrismaClient as MysqlClient } from '@prisma/client';

async function main() {
  console.log('🚀 Starting SQLite to MySQL Data Migration...');

  const sqlite = new SqliteClient();
  const mysql = new MysqlClient();

  try {
    // 1. Connect to both databases
    await sqlite.$connect();
    await mysql.$connect();
    console.log('✅ Connected to both SQLite and MySQL databases successfully.');

    // 2. Disable foreign key checks on MySQL to allow truncation and insertions in any order
    console.log('⚙️ Disabling foreign key checks on MySQL...');
    await mysql.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    // 3. Get all model names from Prisma client
    const modelNames = Object.keys(sqlite).filter(key => {
      const prop = (sqlite as any)[key];
      return (
        prop &&
        typeof prop === 'object' &&
        'findMany' in prop &&
        'createMany' in prop
      );
    });

    console.log(`📋 Found ${modelNames.length} models to migrate.`);

    // We can define custom ordering if we want, but since we disabled FK checks, any order is fine.
    // Let's run a loop to clear and copy data.
    for (const modelName of modelNames) {
      const sqliteModel = (sqlite as any)[modelName];
      const mysqlModel = (mysql as any)[modelName];

      console.log(`🧹 Clearing existing MySQL data for model: ${modelName}...`);
      await mysqlModel.deleteMany();

      console.log(`📥 Reading data from SQLite for model: ${modelName}...`);
      const records = await sqliteModel.findMany();

      if (records.length === 0) {
        console.log(`ℹ️ No records found in SQLite for model: ${modelName}. Skipping.`);
        continue;
      }

      console.log(`📤 Writing ${records.length} records to MySQL for model: ${modelName}...`);
      
      // Copy in chunks of 500 to avoid query limits
      const chunkSize = 500;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await mysqlModel.createMany({
          data: chunk,
          skipDuplicates: true // safety fallback
        });
      }
      console.log(`✅ Migrated model: ${modelName}.`);
    }

    // 4. Re-enable foreign key checks on MySQL
    console.log('⚙️ Re-enabling foreign key checks on MySQL...');
    await mysql.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    try {
      console.log('⚙️ Safety fallback: Re-enabling foreign key checks on MySQL...');
      await mysql.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    } catch (e) {
      console.error('Failed to re-enable foreign key checks:', e);
    }
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await mysql.$disconnect();
  }
}

main();
