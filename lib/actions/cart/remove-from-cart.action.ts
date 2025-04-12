'use server';

import { CartFactory } from '@/application/services/cart/concrete/cart.factory';
import { failure, Result, success } from '@/lib/result';
import { CartDto } from '@/domain/dtos';

export async function removeFromCart(
  cartDto: CartDto,
  productId: string,
): Promise<Result<CartDto>> {
  try {
    const cartStrategy = await CartFactory.createCartStrategy();
    const removeResult = await cartStrategy.removeItem(cartDto, productId);
    if (!removeResult.success) {
      return failure(removeResult.error);
    }

    const updatedCart = removeResult.value;
    return success(updatedCart.toDto());

  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error: new Error('Failed to remove from cart') };
  }
}
