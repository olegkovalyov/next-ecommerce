import { insertProductSchema } from '@/lib/validators/product.validator';
import { z } from 'zod';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  stock: number;
  images: string[];
  isFeatured: boolean;
  banner: string | null;
  price: number;
  rating: number;
  numReviews: number;
  createdAt: Date;
}
