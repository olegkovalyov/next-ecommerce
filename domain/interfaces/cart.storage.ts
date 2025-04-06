import { Result } from '@/lib/result';
import CartEntity from '../entities/cart.entity';

export interface ICartStorage {
  getCart(): Promise<Result<CartEntity>>;
  saveCart(cart: CartEntity): Promise<Result<void>>;
  clearCart(): Promise<Result<void>>;
} 