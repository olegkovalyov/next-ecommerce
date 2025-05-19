import type { CartEntity } from '@/domain/entities/cart.entity';
import type { ProductEntity } from '@/domain/entities/product.entity';
import type { Result } from '@/lib/result';
import type { CartDto } from '@/domain/dtos';

export interface CartServiceInterface {
  addItem(cartDto: CartDto, product: ProductEntity, quantity?: number): Promise<Result<CartEntity>>;

  removeItem(cartDto: CartDto, productId: string, quantity: number): Promise<Result<CartEntity>>;

  clearCart(cartDto: CartDto): Promise<Result<CartEntity>>;

  loadByUserId(userId: string): Promise<Result<CartEntity>>;

  save(cart: CartEntity): Promise<Result<CartEntity>>;
}
