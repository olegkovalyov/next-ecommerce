// Schema for inserting an order item
import { z } from 'zod';
import { currency } from '@/lib/validators/common';

export const insertOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  price: currency,
  qty: z.number(),
});
