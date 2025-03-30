'use server';
import { convertToPlainObject } from '../utils';
import { LATEST_PRODUCTS_LIMIT } from '../constants';
import { Product } from '@/lib/contracts/product';
import { prisma } from '@/db/prisma';

// Get latest products
export async function getLatestProducts(): Promise<Array<Product>> {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: 'desc' },
  });

  return <Array<Product>><unknown>convertToPlainObject(data);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return await prisma.product.findFirst({
    where: { slug: slug },
  });
}
