'use server';

import { failure, Result, success } from '@/lib/result';
import { CartDto } from '@/domain/dtos';
import { CartService } from '@/application/services/cart/cart.service';

export async function clearCart(cartDto: CartDto): Promise<Result<CartDto>> {
  try {
    const result = await CartService.clearCart(cartDto);
    if (result.success) {
      return success(result.value.toDto());
    }
    return failure(result.error);
  } catch (error) {
    return failure(new Error('Failed to clear cart'));
  }
}
