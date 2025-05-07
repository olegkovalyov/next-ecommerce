#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the environment from command line arguments
const env = process.argv[2];

if (!env || !['local', 'production'].includes(env)) {
  console.error('Please specify an environment: local or production');
  process.exit(1);
}

// Define file paths
const envFile = path.join(process.cwd(), '.env');
const localEnvFile = path.join(process.cwd(), '.env.local');
const localEnvBackupFile = path.join(process.cwd(), '.env.local.backup');
const productionEnvFile = path.join(process.cwd(), '.env.production');

// Check if the specified environment file exists
if (env === 'local') {
  // For local environment, check if either .env.local or backup exists
  if (!fs.existsSync(localEnvFile) && !fs.existsSync(localEnvBackupFile)) {
    console.error('Neither .env.local nor .env.local.backup exists.');
    process.exit(1);
  }
} else if (!fs.existsSync(productionEnvFile)) {
  // For production environment, check if .env.production exists
  console.error('Environment file for production does not exist.');
  process.exit(1);
}

// Copy the specified environment file to .env
if (env === 'local') {
  if (fs.existsSync(localEnvFile)) {
    fs.copyFileSync(localEnvFile, envFile);
  } else {
    fs.copyFileSync(localEnvBackupFile, envFile);
  }
} else {
  fs.copyFileSync(productionEnvFile, envFile);
}

if (env === 'production') {
  // If switching to production and .env.local exists, backup it
  if (fs.existsSync(localEnvFile)) {
    fs.copyFileSync(localEnvFile, localEnvBackupFile);
    fs.unlinkSync(localEnvFile);
    console.log('Backed up and removed .env.local file');
  }
} else {
  // If switching to local and backup exists, restore it
  if (fs.existsSync(localEnvBackupFile)) {
    fs.copyFileSync(localEnvBackupFile, localEnvFile);
    console.log('Restored .env.local from backup');
  } else if (!fs.existsSync(localEnvFile)) {
    // If no backup exists and .env.local doesn't exist, create it from .env
    fs.copyFileSync(envFile, localEnvFile);
    console.log('Created new .env.local from current .env');
  }
}

console.log(`Switched to ${env} environment.`);

// Run Prisma generate to update the client
try {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma client generated successfully.');
} catch (error) {
  console.error('Failed to generate Prisma client:', error.message);
  process.exit(1);
}

// If switching to local, ensure Docker PostgreSQL is running
if (env === 'local') {
  try {
    console.log('Checking Docker PostgreSQL...');
    execSync('docker-compose ps postgres', { stdio: 'inherit' });
    
    // Check if the container is running
    const psOutput = execSync('docker-compose ps -q postgres').toString().trim();
    if (!psOutput) {
      console.log('Starting Docker PostgreSQL...');
      execSync('docker-compose up -d postgres', { stdio: 'inherit' });
      console.log('Docker PostgreSQL started successfully.');
    } else {
      console.log('Docker PostgreSQL is already running.');
    }
  } catch (error) {
    console.error('Failed to check/start Docker PostgreSQL:', error.message);
    process.exit(1);
  }
}

console.log(`Environment switch to ${env} completed successfully.`); 