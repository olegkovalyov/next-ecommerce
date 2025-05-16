import dotenv from 'dotenv';
import path from 'path';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
// Load environment variables from .env.test
// __dirname will be the project root, as jest.setup.ts is in the root
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const MIGRATIONS_FOLDER = path.resolve(__dirname, 'infrastructure/db/migrations'); // Path from the project root
const DATABASE_URL_TEST = process.env.DATABASE_URL;

if (!DATABASE_URL_TEST) {
  throw new Error('DATABASE_URL for the test environment is not set in .env.test. Ensure it exists and is correct.');
}

// Global client for migrations (one-time connection)
const migrationPgClient = postgres(DATABASE_URL_TEST, { max: 1 });
// Using 'any' for the Drizzle migration client, as the schema is not as important here as the act of running migrations
const migrationDrizzleClient = drizzle(migrationPgClient) as PostgresJsDatabase<any>;


beforeAll(async () => {
  console.log('Jest: Connecting to the test database and running migrations...');
  try {
    await migrate(migrationDrizzleClient, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log('Jest: Migrations completed successfully.');
  } catch (error) {
    console.error('Jest: Failed to run migrations:', error);
    throw error; // Interrupt tests if migrations failed
  } finally {
    await migrationPgClient.end();
  }
});

afterAll(async () => {
  console.log('Jest: Cleaning up the test database (dropping public schema)...');
  const cleanupPgClient = postgres(DATABASE_URL_TEST, { max: 1 });
  try {
    await cleanupPgClient.unsafe('DROP SCHEMA public CASCADE;');
    await cleanupPgClient.unsafe('CREATE SCHEMA public;');
    // Restore default privileges for the public schema
    // Replace 'postgres' with your test user if it's different and has schema creation rights
    await cleanupPgClient.unsafe('GRANT ALL ON SCHEMA public TO postgres;');
    await cleanupPgClient.unsafe('GRANT ALL ON SCHEMA public TO public;');
    console.log('Jest: Test database cleaned up successfully.');
  } catch (error) {
    console.error('Jest: Failed to clean up the test database:', error);
    // Log the error, but don't interrupt, to allow Jest to finish
  } finally {
    await cleanupPgClient.end();
  }
});

// It is recommended to create new db client instances for each test suite or test
// to ensure isolation and avoid issues with shared state, especially with transactions.
// Therefore, a global dbTestClient is not exported from here.
// Test files will create their own Drizzle client instance using DATABASE_URL_TEST.
// You can also create and export a factory function to create a Drizzle client with the required schema.
// export const createTestDbClient = () => drizzle(postgres(DATABASE_URL_TEST), { schema: allSchemas });
