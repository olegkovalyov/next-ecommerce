import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').default(''),
  email: text('email').notNull().unique(),
  image: text('image'),
  password: text('password'),
  role: text('role').default('user'),
  address: jsonb('address'),
  payment_method: text('payment_method'),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow()
}); 