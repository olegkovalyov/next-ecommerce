'use server';
import { convertToPlainObject } from '../utils';
import { LATEST_PRODUCTS_LIMIT } from '../constants';
import { Product } from '@/lib/contracts/product';
import { db } from '@/infrastructure/db';
import * as schema from '@/infrastructure/db/schema';
import { eq, desc } from 'drizzle-orm';

// Get latest products
export async function getLatestProducts(): Promise<Array<Product>> {
  const data = await db.select()
    .from(schema.product)
    .orderBy(desc(schema.product.created_at))
    .limit(LATEST_PRODUCTS_LIMIT);

  const products = convertToPlainObject(data);
  return products.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    brand: product.brand,
    description: product.description,
    stock: product.stock,
    images: product.images,
    isFeatured: product.is_featured,
    banner: product.banner,
    price: Number(product.price),
    rating: Number(product.rating),
    numReviews: product.num_reviews,
    createdAt: product.created_at || new Date()
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await db.select()
    .from(schema.product)
    .where(eq(schema.product.slug, slug))
    .limit(1);

  if (!products.length) {
    return null;
  }

  const product = products[0];
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    brand: product.brand,
    description: product.description,
    stock: product.stock,
    images: product.images,
    isFeatured: product.is_featured,
    banner: product.banner,
    price: Number(product.price),
    rating: Number(product.rating),
    numReviews: product.num_reviews,
    createdAt: product.created_at || new Date()
  };
}
