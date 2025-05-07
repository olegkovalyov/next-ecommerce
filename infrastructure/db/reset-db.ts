import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

async function resetDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Create direct connection to the database
    const connectionString = 'postgresql://postgres:postgres@localhost:5432/next_ecommerce';
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
    
    // 5. List all remaining tables for verification
    console.log('Checking for remaining tables...');
    const remainingTables = await db.execute(sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public';
    `);
    console.log('Remaining tables:', remainingTables);
    
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