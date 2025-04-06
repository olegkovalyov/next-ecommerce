'use server';

import { CartFactory } from '@/application/services/cart/cart.factory';
import { Result } from '@/lib/result';

export async function clearCart(): Promise<Result<void>> {
  try {
    const strategy = await CartFactory.createCartStrategy();
    return await strategy.clearCart();
  } catch (error) {
    return { success: false, error: new Error('Failed to clear cart') };
  }
}
