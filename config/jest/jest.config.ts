import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from '../../tsconfig.json'; // This path is relative to this file, so it's correct.

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../', // Set project root as rootDir
  setupFiles: ['<rootDir>/config/jest/jest.unit.setup.ts'], 
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }), 
  // testMatch will now be relative to the new rootDir (project root)
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*\\.integration\\.test\\.ts$' 
  ],
  collectCoverageFrom: [
    '<rootDir>/infrastructure/**/*.ts',
    '!<rootDir>/infrastructure/**/*.d.ts',
    '!<rootDir>/infrastructure/**/__tests__/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true,
};

export default config;