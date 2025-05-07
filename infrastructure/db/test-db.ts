import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

// Test database configuration
const TEST_DB_NAME = 'next_ecommerce_test';
const TEST_DB_URL = `postgresql://postgres:postgres@localhost:5432/${TEST_DB_NAME}`;

/**
 * Creates a database connection to the test database
 */
export function createTestDbConnection(): PostgresJsDatabase {
  const client = postgres(TEST_DB_URL, {
    max: 10,
    idle_timeout: 20,
  });
  
  return drizzle(client);
}

/**
 * Returns the test database URL
 */
export function getTestDbUrl(): string {
  return TEST_DB_URL;
} 