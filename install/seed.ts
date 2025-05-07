import dotenv from 'dotenv';
import path from 'path';

// Load .env file from the project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { db } from '@/infrastructure/db';
import sampleData from './sample-data';
import * as schema from '../infrastructure/db/schema/index.js';

async function main() {
  console.log('Starting database seeding with Drizzle...');

  // Clear all tables in the correct order (due to foreign key constraints)
  console.log('Clearing existing data...');
  await db.delete(schema.cartItem);
  await db.delete(schema.cart);
  await db.delete(schema.product);
  await db.delete(schema.account);
  await db.delete(schema.user);

  console.log('Creating users...');
  // Create users
  for (const userData of sampleData.users) {
    await db.insert(schema.user).values(userData);
  }

  console.log('Creating products...');
  // Create products
  for (const productData of sampleData.products) {
    await db.insert(schema.product).values({
      name: productData.name,
      slug: productData.slug,
      category: productData.category,
      description: productData.description,
      images: productData.images,
      price: productData.price.toString(),
      brand: productData.brand,
      rating: productData.rating.toString(),
      num_reviews: productData.numReviews,
      stock: productData.stock,
      is_featured: productData.isFeatured || false,
      banner: productData.banner,
    });
  }

  // Get created users and products
  console.log('Fetching created data...');
  const users = await db.select().from(schema.user);
  const products = await db.select().from(schema.product);

  const adminUser = users.find(user => user.role === 'admin')!;
  const regularUser = users.find(user => user.role === 'user')!;

  console.log('Creating carts...');
  // Create carts for users
  const [adminCartResult] = await db.insert(schema.cart)
    .values({
      user_id: adminUser.id,
    })
    .returning();

  const [userCartResult] = await db.insert(schema.cart)
    .values({
      user_id: regularUser.id,
    })
    .returning();

  console.log('Creating cart items for admin...');
  // Create cart items for admin user
  for (const item of sampleData.carts.admin.items) {
    const product = products.find(p => p.slug === item.productSlug);
    if (!product || typeof product.price !== 'string') {
      console.warn(`Product with slug ${item.productSlug} not found or has no valid price, skipping cart item for admin.`);
      continue;
    }
    await db.insert(schema.cartItem).values({
      cart_id: adminCartResult.id,
      product_id: product.id,
      quantity: item.quantity,
      price: product.price, 
    });
  }

  console.log('Creating cart items for regular user...');
  // Create cart items for regular user
  for (const item of sampleData.carts.user.items) {
    const product = products.find(p => p.slug === item.productSlug);
    if (!product || typeof product.price !== 'string') {
      console.warn(`Product with slug ${item.productSlug} not found or has no valid price, skipping cart item for regular user.`);
      continue;
    }
    await db.insert(schema.cartItem).values({
      cart_id: userCartResult.id,
      product_id: product.id,
      quantity: item.quantity,
      price: product.price, 
    });
  }

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Completed seeding process.');
    process.exit(0);
  });
