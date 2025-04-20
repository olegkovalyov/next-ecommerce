import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// Sets up WebSocket connections for Neon
neonConfig.webSocketConstructor = ws;

const createPrismaClient = () => {
  // For production environment, use Neon adapter
  if (process.env.NODE_ENV === 'production') {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaNeon(pool);

    return new PrismaClient({ adapter }).$extends({
      result: {
        product: {
          price: {
            compute(product) {
              return product.price.toString();
            },
          },
          rating: {
            compute(product) {
              return product.rating.toString();
            },
          },
        },
        cartItem: {
          product: {
            compute(cartItem: { product: { price: any; rating: any; [key: string]: any } }) {
              return {
                ...cartItem.product,
                price: cartItem.product.price.toString(),
                rating: cartItem.product.rating.toString(),
              };
            },
          },
        },
      },
    });
  }

  // For local development, use standard Prisma client
  return new PrismaClient();
};

export const prisma = createPrismaClient() as PrismaClient;

