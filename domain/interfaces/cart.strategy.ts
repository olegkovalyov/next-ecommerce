import { Result } from '@/lib/result';
import { ProductEntity } from '@/domain/entities/product.entity';
import { CartEntity } from '@/domain/entities/cart.entity';

export interface ICartStrategy {
  getCart(): Promise<Result<CartEntity>>;

  addItem(product: ProductEntity, quantity: number): Promise<Result<CartEntity>>;

  removeItem(productId: string, quantity: number): Promise<Result<CartEntity>>;

  updateItem(productId: string, quantity: number): Promise<Result<CartEntity>>;

  clearCart(): Promise<Result<CartEntity>>;
}
