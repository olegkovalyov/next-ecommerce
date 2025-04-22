import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductMapper } from './mappers/product.mapper';
import { failure, Result, success } from '@/lib/result';
import { PrismaClient } from '@prisma/client';

export class ProductRepository {
  constructor(private readonly prisma: PrismaClient) {
  }

  async findById(id: string): Promise<Result<ProductEntity | null>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return success(null);
    }

    return ProductEntity.fromDto(ProductMapper.toDto(product));
  }

  async findBySlug(slug: string): Promise<Result<ProductEntity | null>> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return success(null);
    }

    return ProductEntity.fromDto(ProductMapper.toDto(product));
  }

  async save(product: ProductEntity): Promise<Result<ProductEntity>> {
    const productDto = product.toDto();
    const prismaData = ProductMapper.toPrisma(productDto);

    try {
      const savedProduct = await this.prisma.product.upsert({
        where: { id: productDto.id },
        create: { id: productDto.id, ...prismaData },
        update: prismaData,
      });
      return ProductEntity.fromDto(ProductMapper.toDto(savedProduct));
    } catch (error: unknown) {
      console.error('Failed to save product:', error);
      return failure(new Error('Failed to save product'));
    }
  }

  async delete(id: string): Promise<Result<ProductEntity>> {
    const product = await this.findById(id);

    if (!product.success || !product.value) {
      return failure(new Error('Product not found'));
    }

    try {
      await this.prisma.product.delete({
        where: { id },
      });

      return success(product.value);
    } catch (error: unknown) {
      return failure(new Error('Failed to delete product'));
    }
  }
}
