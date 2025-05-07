// This file runs before each integration test
// Load environment variables from .env.test
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: '.env.test' });

// eslint-disable-next-line @typescript-eslint/no-var-requires
// Adjust path to infrastructure/db, now two levels up
const { postgresClient } = require('../../infrastructure/db');

// Global setup for all integration tests
beforeAll(async () => {
  console.log('Integration test suite starting...');
  console.log(`Using database: ${process.env.DATABASE_URL}`);

  // Verify we're using the test database
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('next_ecommerce_test')) {
    throw new Error('Integration tests must run against the test database!');
  }
});

// Global teardown for all integration tests
afterAll(async () => {
  console.log('Integration test suite completed.');

  if (postgresClient && typeof postgresClient.end === 'function') {
    await postgresClient.end({ timeout: 5 });
    console.log('Postgres connection pool closed.');
  } else {
    console.warn('Postgres client (postgresClient) or its end method not found. Connection might not be closed.');
  }
});
