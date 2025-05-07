import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductDto } from '@/domain/dtos/product.dto';
import { Result } from '@/lib/result';
import { ProductRepositoryInterface } from '@/domain/repositories/product-repository.interface';

export class ProductService {
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
}
