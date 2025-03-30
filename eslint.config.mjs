// eslint.config.mjs
import { defineConfig } from 'eslint-define-config';

export default defineConfig({
  extends: [
    'eslint:recommended', // Base ESLint recommended rules
    'plugin:react/recommended', // React recommended rules
    'plugin:jsx-a11y/recommended', // Accessibility (A11y) rules
    'plugin:import/errors', // Import plugin for import-related issues
    'plugin:import/warnings', // Import plugin for warning issues
    'plugin:prettier/recommended', // Prettier integration for code formatting
    'plugin:next/recommended', // Next.js recommended rules
  ],
  parserOptions: {
    ecmaVersion: 'latest', // Enable the latest ECMAScript features
    sourceType: 'module', // Enable modules
    ecmaFeatures: {
      jsx: true, // Enable JSX syntax support
    },
  },
  plugins: [
    'react',
    'jsx-a11y',
    'import',
    'prettier',
    'next',
  ],
  rules: {
    // Next.js-specific rules
    'next/no-img-element': 'warn', // Warn about using <img> instead of <Image>
    'next/no-page-custom-font': 'warn', // Warn about custom fonts in pages/_document.js
    'next/next-script-for-ga': 'warn', // Use next/script for external scripts like Google Analytics

    // React-specific rules
    'react/jsx-uses-react': 'error', // Ensures that React is in scope when using JSX
    'react/jsx-uses-vars': 'error', // Prevents unused variables in JSX

    // JSX accessibility rules (A11Y)
    'jsx-a11y/anchor-is-valid': 'warn', // Ensures valid anchor tags
    'jsx-a11y/label-has-associated-control': ['warn', { assert: 'either' }], // Ensures labels are associated with controls

    // Import-related rules
    'import/no-unresolved': 'error', // Ensure all imports resolve correctly
    'import/no-cycle': 'error', // Prevent circular dependencies

    // TypeScript-related rules (if applicable)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',

    // Disallow console.log in production
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
  settings: {
    react: {
      version: 'detect', // Automatically detects the React version
    },
  },
});
