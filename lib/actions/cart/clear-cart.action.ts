'use server';

import { CartFactory } from '@/application/services/cart/concrete/cart.factory';
import { failure, Result, success } from '@/lib/result';
import { CartDto } from '@/domain/dtos';

export async function clearCart(cartDto: CartDto): Promise<Result<CartDto>> {
  try {
    const cartStrategy = await CartFactory.createCartStrategy();
    const result = await cartStrategy.clearCart(cartDto);
    if (result.success) {
      return success(result.value.toDto());
    }
    return failure(result.error);
  } catch (error) {
    return failure(new Error('Failed to clear cart'));
  }
}
