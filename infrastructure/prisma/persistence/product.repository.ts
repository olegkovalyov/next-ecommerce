import { ProductEntity } from '@/domain/entities/product.entity';
import { prisma } from '@/infrastructure/prisma/prisma';
import { failure, Result, success } from '@/lib/result';
import { formatError } from '@/lib/utils';
import { ProductMapper } from '@/domain/mappers/product.mapper';

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

      const result = await prisma.product.upsert({
        where: { id: product.id },
        update: prismaProduct,
        create: prismaProduct,
      });

      const updatedProductDto = ProductMapper.toDto(result);
      return success(ProductEntity.create(updatedProductDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async getProductById(id: string): Promise<Result<ProductEntity>> {
    try {
      const productData = await prisma.product.findUnique({
        where: { id },
      });

      if (!productData) {
        return failure(new Error('Product not found'));
      }

      const productDto = ProductMapper.toDto(productData);
      return success(ProductEntity.create(productDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async getProductBySlug(slug: string): Promise<Result<ProductEntity>> {
    try {
      const productData = await prisma.product.findUnique({
        where: { slug },
      });

      if (!productData) {
        return failure(new Error('Product not found'));
      }

      const productDto = ProductMapper.toDto(productData);
      return success(ProductEntity.create(productDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async getFeaturedProducts(): Promise<Result<ProductEntity[]>> {
    try {
      const productsData = await prisma.product.findMany({
        where: { isFeatured: true },
      });

      const products = productsData.map((productData) => {
        const productDto = ProductMapper.toDto(productData);
        return ProductEntity.create(productDto);
      });

      return success(products);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }
}

export { ProductRepository };
