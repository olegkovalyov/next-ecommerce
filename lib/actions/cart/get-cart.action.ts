'use server';

import { auth } from '@/auth';
import { Result, success, failure } from '@/lib/result';
import { CartService } from '@/application/services/cart/cart.service';
import { ServerGuestCartService } from '@/application/services/cart/server-guest-cart.service';

export async function getCart(): Promise<Result<unknown>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Handle guest cart
      const cart = await ServerGuestCartService.getCartItems();
      return success(cart);
    }

    // Handle authenticated user cart
    const cartResult = await CartService.loadOrCreateCart();
    if (!cartResult.success) {
      return failure(cartResult.error);
    }

    const cart = cartResult.value;
    if (!cart) {
      return failure(new Error('Cart not found'));
    }

    return success(cart.getCartData());
  } catch (error) {
    console.error('Error getting cart:', error);
    return failure(new Error('Failed to get cart'));
  }
}
