import { Result } from '@/lib/result';
import CartEntity from '../entities/cart.entity';

export interface ICartRepository {
  getCart(userId: string): Promise<Result<CartEntity>>;
  saveCart(cart: CartEntity): Promise<Result<void>>;
  deleteCart(userId: string): Promise<Result<void>>;
} 