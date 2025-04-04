'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Result, success, failure } from '@/lib/result';
import { CartLoader } from '@/infrastructure/services/cart.loader';
import { CartRepository } from '@/infrastructure/persistence/cart.repository';
import { ServerGuestCartService } from '@/infrastructure/services/server-guest-cart.service';

export async function removeFromCart(
  productId: string,
  shouldRemoveAll: boolean = false
): Promise<Result<string>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Handle guest cart
      await ServerGuestCartService.removeItem(productId, shouldRemoveAll);
      revalidatePath('/cart');
      return success('Item removed from cart');
    }

    // Handle authenticated user cart
    const cartResult = await CartLoader.loadOrCreateCart();
    if (!cartResult.success) {
      return failure(cartResult.error);
    }

    const cart = cartResult.value;
    if (!cart) {
      return failure(new Error('Cart not found'));
    }

    cart.removeProduct(productId);

    const saveResult = await CartRepository.saveCart(cart);
    if (!saveResult.success) {
      return failure(saveResult.error);
    }

    revalidatePath('/cart');
    return success('Item removed from cart');
  } catch (error) {
    console.error('Error removing from cart:', error);
    return failure(new Error('Failed to remove item from cart'));
  }
}
