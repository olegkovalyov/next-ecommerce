import { pgTable, uuid, text, serial, timestamp, unique } from 'drizzle-orm/pg-core';
import { user } from './user';

export const account = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  provider_account_id: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: serial('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  created_at: timestamp('created_at', { precision: 6 }).defaultNow(),
  updated_at: timestamp('updated_at', { precision: 6 }).defaultNow()
}, (table) => {
  return {
    provider_account_unique: unique('accounts_provider_provider_account_id_unique').on(table.provider, table.provider_account_id)
  };
}); 