import { pgTable, integer, uuid, text, timestamp, index, unique, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm'; 
import { user } from './user';
import { product } from './product';

export const cart = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }).unique(),
  tax_percentage: integer('tax_percentage').notNull().default(0),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow()
}, (table) => {
  return {
    user_id_idx: index('carts_user_id_idx').on(table.user_id)
  };
});

export const cartItem = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cart_id: uuid('cart_id').references(() => cart.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').references(() => product.id).notNull(),
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow()
}, (table) => {
  return {
    cart_product_unique: unique('cart_items_cart_id_product_id_unique').on(table.cart_id, table.product_id),
    cart_id_idx: index('cart_items_cart_id_idx').on(table.cart_id),
    product_id_idx: index('cart_items_product_id_idx').on(table.product_id)
  };
}); 

// Relations for Cart
export const cartRelations = relations(cart, ({one, many}) => ({
  user: one(user, {
    fields: [cart.user_id],
    references: [user.id],
  }),
  cartItems: many(cartItem),
}));

// Relations for CartItem
export const cartItemRelations = relations(cartItem, ({one}) => ({
  cart: one(cart, {
    fields: [cartItem.cart_id],
    references: [cart.id],
  }),
  product: one(product, {
    fields: [cartItem.product_id],
    references: [product.id],
  }),
}));