import { pgTable, integer, uuid, text, decimal, boolean, timestamp, index } from 'drizzle-orm/pg-core';

export const product = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique('product_slug_idx'),
  category: text('category').notNull(),
  images: text('images').array().notNull(),
  brand: text('brand').notNull(),
  description: text('description').notNull(),
  stock: integer('stock').notNull().default(0),
  price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0'),
  rating: decimal('rating', { precision: 3, scale: 2 }).notNull().default('0'),
  num_reviews: integer('num_reviews').notNull().default(0),
  is_featured: boolean('is_featured').notNull().default(false),
  banner: text('banner'),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow().$onUpdate(() => new Date())
}); 