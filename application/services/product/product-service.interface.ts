import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductDto } from '@/domain/dtos/product.dto';
import { Result } from '@/lib/result';

export interface ProductServiceInterface {
  createProduct(productDto: ProductDto): Promise<Result<ProductEntity>>;
  saveProduct(product: ProductEntity): Promise<Result<ProductEntity>>;
  deleteProduct(productId: string): Promise<Result<ProductEntity>>;
  loadProductById(productId: string): Promise<Result<ProductEntity>>;
  loadProductBySlug(slug: string): Promise<Result<ProductEntity>>;
}
