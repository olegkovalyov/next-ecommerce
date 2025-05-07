import type { Config } from 'drizzle-kit';

export default {
  schema: './infrastructure/db/schema',
  out: './infrastructure/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
