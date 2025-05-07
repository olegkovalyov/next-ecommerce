import { execSync } from 'child_process';
import setupTestDatabase from '../infrastructure/db/setup-test-db';
import { getTestDbUrl } from '../infrastructure/db/test-db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates a temporary .env.test file with test database configuration
 */
function createTestEnvFile() {
  const testEnvContent = `
# Database
DATABASE_URL="${getTestDbUrl()}"
DATABASE_TYPE="docker"

# Other variables can be copied from .env.local
`;

  const testEnvPath = path.join(process.cwd(), '.env.test');
  fs.writeFileSync(testEnvPath, testEnvContent);
  console.log(`Created test environment file: ${testEnvPath}`);
  
  return testEnvPath;
}

/**
 * Clean up temporary files
 */
function cleanup(testEnvPath: string) {
  if (fs.existsSync(testEnvPath)) {
    fs.unlinkSync(testEnvPath);
    console.log(`Removed test environment file: ${testEnvPath}`);
  }
}

/**
 * Run integration tests
 */
async function runIntegrationTests() {
  let testEnvPath = '';

  // Find arguments after '--'. If '--' is not present, this will be empty.
  const doubleDashIndex = process.argv.indexOf('--');
  const testSpecificArgs = doubleDashIndex !== -1 ? process.argv.slice(doubleDashIndex + 1) : [];
  
  // The first argument after '--' is assumed to be the test file path, if any.
  const jestTestFilePathArg = testSpecificArgs.length > 0 ? ` ${testSpecificArgs[0]}` : '';

  try {
    // 1. Set up test database
    await setupTestDatabase();
    
    // 2. Create test environment file
    testEnvPath = createTestEnvFile();
    
    // 3. Run Drizzle migrations on test database
    console.log('Running migrations on test database...');
    execSync('npx dotenv-cli -e .env.test -- tsx infrastructure/db/migrate.ts', { stdio: 'inherit' });
    
    // 4. Seed test database with test data (REMOVED)
    // console.log('Seeding test database...');
    // execSync('NODE_ENV=test npx tsx ./infrastructure/db/seed.ts', { stdio: 'inherit' });
    
    // 5. Run integration tests
    console.log('Running integration tests...');
    const jestCommand = `NODE_ENV=test npx jest --config=config/jest/jest.integration.config.js${jestTestFilePathArg}`;
    console.log(`Executing Jest: ${jestCommand}`);
    execSync(jestCommand, { stdio: 'inherit' });
    
    console.log('Integration tests completed successfully');
  } catch (error) {
    console.error('Error running integration tests:', error);
    process.exit(1);
  } finally {
    // Clean up temporary files
    cleanup(testEnvPath);
  }
}

// Run if this script is called directly
if (require.main === module) {
  runIntegrationTests();
}

export default runIntegrationTests; 