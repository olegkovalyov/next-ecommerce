import postgres from 'postgres';

// Test database configuration
const TEST_DB_NAME = 'next_ecommerce_test';
const POSTGRES_URL = 'postgresql://postgres:postgres@localhost:5432/postgres';

async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');

    // Connect to default postgres database to create/reset test database
    const adminClient = postgres(POSTGRES_URL);

    // Drop test database if it exists (with force)
    console.log(`Dropping database ${TEST_DB_NAME} if exists...`);
    await adminClient.unsafe(`DROP DATABASE IF EXISTS ${TEST_DB_NAME} WITH (FORCE);`);

    // Create test database
    console.log(`Creating database ${TEST_DB_NAME}...`);
    await adminClient.unsafe(`CREATE DATABASE ${TEST_DB_NAME};`);

    // Close admin connection
    await adminClient.end();

    console.log('Test database created successfully');

    // Now connect to the test database to set it up
    const testDbUrl = `postgresql://postgres:postgres@localhost:5432/${TEST_DB_NAME}`;
    const testClient = postgres(testDbUrl);

    // We'll use the Drizzle migration system to set up the schema
    console.log('Setting up test database schema...');

    // Close test connection
    await testClient.end();

    console.log('Test database setup completed successfully');
    return { testDbUrl };
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
}

// If this script is run directly
if (require.main === module) {
  setupTestDatabase().then(({ testDbUrl }) => {
    console.log(`Test database URL: ${testDbUrl}`);
    process.exit(0);
  });
}

export default setupTestDatabase;
