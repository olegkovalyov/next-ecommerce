import { CartEntity } from '../entities/cart.entity';
import { Result } from '@/lib/result';

export interface CartRepositoryInterface {
  findById(id: string): Promise<Result<CartEntity>>;

  findByUserId(userId: string): Promise<Result<CartEntity>>;

  save(cart: CartEntity): Promise<Result<CartEntity>>;

  delete(id: string): Promise<Result<CartEntity>>;
}
