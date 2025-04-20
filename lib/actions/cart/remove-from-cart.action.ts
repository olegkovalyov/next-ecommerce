'use server';

import { failure, Result, success } from '@/lib/result';
import { CartDto } from '@/domain/dtos';
import { CartService } from '@/application/services/cart/cart.service';

export async function removeFromCart(
  cartDto: CartDto,
  productId: string,
  quantity: number = 1,
): Promise<Result<CartDto>> {
  try {
    const removeResult = await CartService.removeItem(cartDto, productId, quantity);
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
