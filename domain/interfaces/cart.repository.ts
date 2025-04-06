import { Result } from '@/lib/result';
import { CartEntity } from '../entities/cart.entity';

export interface ICartRepository {
  findByUserId(userId: string): Promise<Result<CartEntity>>;

  save(cart: CartEntity): Promise<Result<CartEntity>>;

  delete(id: string): Promise<Result<CartEntity>>;
}
