import { Result } from '@/lib/result';
import { CartEntity } from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';

export interface ICartStrategy {
  getCart(): Promise<Result<CartEntity>>;

  addItem(product: ProductEntity, quantity: number): Promise<Result<CartEntity>>;

  removeItem(productId: string, quantity: number): Promise<Result<CartEntity>>;

  updateItem(productId: string, quantity: number): Promise<Result<CartEntity>>;

  clearCart(): Promise<Result<CartEntity>>;
}
