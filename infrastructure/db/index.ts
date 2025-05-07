import { drizzle } from 'drizzle-orm/postgres-js';
import { neonConfig } from '@neondatabase/serverless';
import postgres, { PostgresType, Sql } from 'postgres';
import ws from 'ws';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Configure WebSockets for Neon Serverless
neonConfig.webSocketConstructor = ws;

let pgClientInstance: Sql | null = null;

const getPostgresClient = (): Sql => {
  if (pgClientInstance) {
    return pgClientInstance;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please define it.');
  }

  // Base options for the postgres client
  const options: postgres.Options<Record<string, PostgresType>> = {};

  if (process.env.NODE_ENV === 'production') {
    // For production (e.g., Neon), SSL is typically required
    options.ssl = true;
  } else {
    // For local development
    options.max = 10;
    options.idle_timeout = 20;
  }

  // Override or provide user/password if DB_USER and DB_PASSWORD are set in .env
  // These will take precedence over credentials in DATABASE_URL or provide them if missing from it.
  if (process.env.DB_USER) {
    options.user = process.env.DB_USER;
  }
  if (process.env.DB_PASSWORD) {
    options.password = process.env.DB_PASSWORD;
  }

  pgClientInstance = postgres(process.env.DATABASE_URL, options);

  return pgClientInstance;
};

// Export the underlying postgres client instance
export const postgresClient = getPostgresClient();

// Export the Drizzle ORM instance, configured with the postgres client and schema
export const db = drizzle(postgresClient, { schema });

// Update DrizzleClient type to include the schema for better type inference
export type DrizzleClient = PostgresJsDatabase<typeof schema>;
