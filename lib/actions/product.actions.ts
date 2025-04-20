'use server';
import { convertToPlainObject } from '../utils';
import { LATEST_PRODUCTS_LIMIT } from '../constants';
import { Product } from '@/lib/contracts/product';
import { prisma } from '@/infrastructure/prisma/prisma';

// Get latest products
export async function getLatestProducts(): Promise<Array<Product>> {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: 'desc' },
  });

  const products = convertToPlainObject(data);
  return products.map(product => ({
    ...product,
    price: Number(product.price),
    rating: Number(product.rating)
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await prisma.product.findFirst({
    where: { slug: slug },
  });

  if (!product) {
    return null;
  }

  const plainProduct = convertToPlainObject(product);
  return {
    ...plainProduct,
    price: Number(plainProduct.price),
    rating: Number(plainProduct.rating)
  };
}
