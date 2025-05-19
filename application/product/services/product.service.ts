import { ProductEntity } from '@/domain/entities/product.entity.ts';
import { ProductDto } from '@/domain/dtos/product.dto.ts';
import { Result } from '@/lib/result';
import { ProductRepositoryInterface } from '@/domain/repositories/product-repository.interface.ts';
import { ProductServiceInterface } from './product-service.interface.ts';

export class ProductService implements ProductServiceInterface {
  constructor(private readonly productRepository: ProductRepositoryInterface) {}

  async createProduct(productDto: ProductDto): Promise<Result<ProductEntity>> {
    return ProductEntity.fromDto(productDto);
  }

  async saveProduct(product: ProductEntity): Promise<Result<ProductEntity>> {
    return await this.productRepository.save(product);
  }

  async deleteProduct(productId: string): Promise<Result<ProductEntity>> {
    return await this.productRepository.delete(productId);
  }

  async loadProductById(productId: string): Promise<Result<ProductEntity>> {
    return await this.productRepository.findById(productId);
  }

  async loadProductBySlug(slug: string): Promise<Result<ProductEntity>> {
    return await this.productRepository.findBySlug(slug);
  }

  async getLatestProducts(limit: number): Promise<Result<ProductEntity[]>> {
    return await this.productRepository.findAll({
      limit,
      sortBy: [{ field: 'createdAt', order: 'desc' }],
    });
  }
}
