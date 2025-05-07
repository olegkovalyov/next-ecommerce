/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../', // Set project root as rootDir
  testMatch: ['**/__tests__/**/*.integration.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/config/jest/jest.integration.setup.js'],
  verbose: true,
  testTimeout: 30000, // Longer timeout for integration tests
};

module.exports = config;