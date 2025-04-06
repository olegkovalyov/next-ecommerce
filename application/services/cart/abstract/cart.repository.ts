import { Result } from '@/lib/result';
import { CartEntity } from '@/domain/entities/cart.entity';

export interface CartRepositoryInterface {
  findByUserId(userId: string): Promise<Result<CartEntity>>;

  save(cart: CartEntity): Promise<Result<CartEntity>>;

  delete(id: string): Promise<Result<CartEntity>>;
}
