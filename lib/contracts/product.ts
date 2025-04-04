import { insertProductSchema } from '@/lib/validators/product.validator';
import { z } from 'zod';

export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  rating: string;
  numReviews: number;
  createdAt: Date;
};
