import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function main() {
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  const db = drizzle(migrationClient);
  
  console.log('Running migrations...');
  
  await migrate(db, { migrationsFolder: './infrastructure/db/migrations' });
  
  console.log('Migrations completed successfully!');
  
  await migrationClient.end();
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Error running migrations:', error);
  process.exit(1);
}); 