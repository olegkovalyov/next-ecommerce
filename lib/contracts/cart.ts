import { z } from 'zod';
import { ProductEntity } from '@/domain/product.entity';

export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  image: string;
};

export const insertCartSchema = z.object({
  id: z.string(),
  sessionCartId: z.string().optional(),
  userId: z.string().optional(),
  shippingPrice: z.number(),
  taxPercentage: z.number(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    slug: z.string(),
    price: z.number(),
    qty: z.number().min(1),
    image: z.string(),
  })),
});

export type Cart = z.infer<typeof insertCartSchema>;
