import { z } from 'zod';

export const cartItemSchema = z.object({
  id: z.string().min(1, 'Cart item id is required'),
  cartId: z.string().min(1, 'Cart id is required'),
  productId: z.string().min(1, 'Product id is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  product: z.any(),
});

export const cartSchema = z.object({
  id: z.string().min(1, 'Cart id is required'),
  userId: z.string().nullable(),
  taxPercentage: z.number().min(0, 'Tax percentage must be at least 0'),
  items: z.array(cartItemSchema),
});

export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;
