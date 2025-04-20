import { z } from 'zod';

const cartItemSchema = z.object({
  id: z.string(),
  cartId: z.string(),
  productId: z.string(),
  quantity: z.number(),
  qty: z.number(), // For backward compatibility
  product: z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    price: z.number(),
    images: z.array(z.string()),
    stock: z.number(),
  }),
});

export const cartSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  items: z.array(cartItemSchema),
  taxPercentage: z.number().min(0),
});

export type Cart = z.infer<typeof cartSchema>;
