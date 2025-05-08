import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('Error: DATABASE_URL is not defined in your .env file.');
    process.exit(1);
  }

  // Validate that we are not accidentally running on a production database
  // You might want to add more sophisticated checks, e.g., ensuring the DB name contains 'test' or 'dev'
  if (connectionString.includes('prod') || connectionString.includes('production')) {
    console.error('Error: DATABASE_URL appears to be a production database. Aborting reset.');
    console.error('If you are sure, manually edit this safety check in reset-db.ts.');
    process.exit(1);
  }

  try {
    console.log(`Starting database cleanup for: ${connectionString.replace(/:[^:]*@/, ':[PASSWORD_HIDDEN]@')}`);
    
    // Create direct connection to the database
    const client = postgres(connectionString);
    const db = drizzle(client);
    
    console.log('Connected to database successfully');
    
    // Delete tables in the correct order (considering foreign key constraints)
    
    // 1. First delete tables that reference other tables
    console.log('Dropping table cart_items...');
    await db.execute(sql`DROP TABLE IF EXISTS cart_items CASCADE;`);
    
    console.log('Dropping table order_product_snapshots...');
    await db.execute(sql`DROP TABLE IF EXISTS order_product_snapshots CASCADE;`);
    
    console.log('Dropping table order_items...');
    await db.execute(sql`DROP TABLE IF EXISTS order_items CASCADE;`);
    
    // 2. Delete intermediate tables
    console.log('Dropping table orders...');
    await db.execute(sql`DROP TABLE IF EXISTS orders CASCADE;`);
    
    console.log('Dropping table carts...');
    await db.execute(sql`DROP TABLE IF EXISTS carts CASCADE;`);
    
    console.log('Dropping table accounts...');
    await db.execute(sql`DROP TABLE IF EXISTS accounts CASCADE;`);
    
    console.log('Dropping table sessions...');
    await db.execute(sql`DROP TABLE IF EXISTS sessions CASCADE;`);
    
    console.log('Dropping table verification_tokens...');
    await db.execute(sql`DROP TABLE IF EXISTS verification_tokens CASCADE;`);
    
    // 3. Delete main tables
    console.log('Dropping table products...');
    await db.execute(sql`DROP TABLE IF EXISTS products CASCADE;`);
    
    console.log('Dropping table users...');
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
    
    // 4. Delete enum types
    console.log('Dropping OrderStatus enum type...');
    await db.execute(sql`DROP TYPE IF EXISTS "OrderStatus" CASCADE;`);
    
    console.log('Dropping _drizzle_migrations table...');
    await db.execute(sql`DROP TABLE IF EXISTS _drizzle_migrations CASCADE;`);

    // 5. Drop the drizzle schema (used by drizzle-kit studio)
    console.log('Dropping drizzle schema (if exists)...');
    await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

    // 6. List all remaining tables for verification
    console.log('Checking for remaining tables in public schema...');
    const remainingTablesResult = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    
    // The result might be an array of objects, or a different structure depending on the driver/client version.
    // Assuming 'remainingTablesResult' is an array of objects like { tablename: string }
    const remainingTableNames = Array.isArray(remainingTablesResult) 
      ? remainingTablesResult.map((row: any) => row.tablename) 
      : [];

    if (remainingTableNames.length > 0) {
      console.log('Remaining tables in public schema:', remainingTableNames);
    } else {
      console.log('No tables found in public schema after cleanup.');
    }
    
    console.log('Database cleanup completed successfully.');
    
    // Close the connection
    await client.end();
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    process.exit(0);
  }
}

resetDatabase(); 