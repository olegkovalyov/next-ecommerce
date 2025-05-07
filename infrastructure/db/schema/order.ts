import { pgTable, integer, uuid, text, jsonb, decimal, boolean, timestamp, pgEnum, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { product } from './product';
import { user } from './user';

export const orderStatusEnum = pgEnum('OrderStatus', [
  'pending_payment',
  'payment_failed',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);

export const order = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  shipping_address: jsonb('shipping_address').notNull(),
  payment_method: text('payment_method').notNull(),
  payment_result: jsonb('payment_result'),
  items_price: decimal('items_price', { precision: 12, scale: 2 }).notNull(),
  shipping_price: decimal('shipping_price', { precision: 12, scale: 2 }).notNull(),
  tax_price: decimal('tax_price', { precision: 12, scale: 2 }).notNull(),
  total_price: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  status: orderStatusEnum('status').default('pending_payment'),
  is_paid: boolean('is_paid').default(false),
  paid_at: timestamp('paid_at', { precision: 6 }),
  is_delivered: boolean('is_delivered').default(false),
  delivered_at: timestamp('delivered_at', { precision: 6 }),
  tracking_number: text('tracking_number'),
  customer_notes: text('customer_notes'),
  internal_notes: text('internal_notes'),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow()
}, (table) => {
  return {
    user_id_idx: index('orders_user_id_idx').on(table.user_id),
    status_idx: index('orders_status_idx').on(table.status),
    created_at_idx: index('orders_created_at_idx').on(table.created_at)
  };
});

export const orderItem = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').references(() => order.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').references(() => product.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull().default(1),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  image: text('image').notNull(),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow()
}, (table) => {
  return {
    order_product_unique: unique('order_items_order_id_product_id_unique').on(table.order_id, table.product_id),
    order_id_idx: index('order_items_order_id_idx').on(table.order_id),
    product_id_idx: index('order_items_product_id_idx').on(table.product_id)
  };
});

export const orderProductSnapshot = pgTable('order_product_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_item_id: uuid('order_item_id').references(() => orderItem.id, { onDelete: 'cascade' }).unique(),
  product_id: uuid('product_id').references(() => product.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  category: text('category').notNull(),
  brand: text('brand').notNull(),
  description: text('description').notNull(),
  stock: integer('stock').notNull().default(0),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  images: text('images').array().notNull(),
  rating: decimal('rating', { precision: 3, scale: 1 }).notNull(),
  num_reviews: integer('num_reviews').notNull().default(0),
  is_featured: boolean('is_featured').default(false),
  banner: text('banner'),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow()
});

// Отношения для таблицы 'order'
export const orderRelations = relations(order, ({ one, many }) => ({
  user: one(user, {
    fields: [order.user_id],
    references: [user.id],
  }),
  orderItems: many(orderItem),
}));

// Отношения для таблицы 'orderItem'
export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.order_id],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.product_id],
    references: [product.id],
  }),
  snapshot: one(orderProductSnapshot, {
    fields: [orderItem.id],
    references: [orderProductSnapshot.order_item_id]
  })
}));

// Отношения для таблицы 'orderProductSnapshot'
export const orderProductSnapshotRelations = relations(orderProductSnapshot, ({ one }) => ({
  orderItem: one(orderItem, {
    fields: [orderProductSnapshot.order_item_id],
    references: [orderItem.id],
  }),
  product: one(product, {
    fields: [orderProductSnapshot.product_id],
    references: [product.id],
  }),
}));