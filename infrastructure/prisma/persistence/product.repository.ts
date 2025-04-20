import { ProductEntity } from '@/domain/entities/product.entity';
import { prisma } from '@/infrastructure/prisma/prisma';
import { failure, Result } from '@/lib/result';
import { formatError } from '@/lib/utils';
import { ProductMapper } from '@/infrastructure/repositories/mappers/product.mapper';
import { PrismaClient } from '@prisma/client';

class ProductRepository {
  static async saveProduct(product: ProductEntity): Promise<Result<ProductEntity>> {
    try {
      const prismaProduct = ProductMapper.toPrisma({
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        brand: product.brand,
        description: product.description,
        stock: product.stock,
        images: product.images,
        isFeatured: product.isFeatured,
        banner: product.banner,
        price: product.price,
        rating: product.rating,
        numReviews: product.numReviews,
        createdAt: product.createdAt,
      });

      const result = await (prisma as PrismaClient).product.upsert({
        where: { id: product.id },
        update: prismaProduct,
        create: prismaProduct,
      });

      const updatedProductDto = ProductMapper.toDto(result);
      return ProductEntity.create(updatedProductDto);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async getProductById(id: string): Promise<Result<ProductEntity>> {
    try {
      const productData = await (prisma as PrismaClient).product.findUnique({
        where: { id },
      });

      if (!productData) {
        return failure(new Error('Product not found'));
      }

      const productDto = ProductMapper.toDto(productData);
      return ProductEntity.create(productDto);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async getProductBySlug(slug: string): Promise<Result<ProductEntity>> {
    try {
      const productData = await (prisma as PrismaClient).product.findUnique({
        where: { slug },
      });

      if (!productData) {
        return failure(new Error('Product not found'));
      }

      const productDto = ProductMapper.toDto(productData);
      return ProductEntity.create(productDto);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }
}

export { ProductRepository };
