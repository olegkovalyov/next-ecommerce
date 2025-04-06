import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductMapper } from './mappers/product.mapper';
import { prisma } from '@/infrastructure/prisma/prisma';
import { failure, Result } from '@/lib/result';

type ExtendedPrismaClient = typeof prisma;

export class ProductRepository {
  constructor(private readonly prisma: ExtendedPrismaClient) {
  }

  async findById(id: string): Promise<Result<ProductEntity>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return failure(new Error('Product not found'));
    }

    return ProductEntity.fromDto(ProductMapper.toDto(product));
  }

  async findBySlug(slug: string): Promise<Result<ProductEntity>> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (!product) {
      return failure(new Error('Product not found'));
    }

    return ProductEntity.fromDto(ProductMapper.toDto(product));
  }

  async save(product: ProductEntity): Promise<Result<ProductEntity>> {
    const productDto = product.toDto();
    const prismaData = ProductMapper.toPrisma(productDto);

    try {
      const savedProduct = await this.prisma.product.upsert({
        where: { id: productDto.id },
        create: prismaData,
        update: prismaData,
      });
      return ProductEntity.fromDto(ProductMapper.toDto(savedProduct));
    } catch (error: unknown) {
      return failure(new Error('Failed to save product'));
    }
  }

  async delete(id: string): Promise<Result<ProductEntity>> {
    const product = await this.findById(id);

    if (!product.success) {
      return failure(new Error('Failed to delete product'));
    }

    try {
      await this.prisma.product.delete({
        where: { id },
      });

      return product;
    } catch (error: unknown) {
      return failure(new Error('Failed to delete product'));
    }
  }
}
