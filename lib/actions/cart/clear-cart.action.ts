'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Result, success, failure } from '@/lib/result';
import { CartService } from '@/application/services/cart/cart.service';
import { CartRepository } from '@/infrastructure/prisma/persistence/cart.repository';
import { ServerGuestCartService } from '@/application/services/cart/server-guest-cart.service';
import CartEntity from '@/domain/cart.entity';

export async function clearCart(): Promise<Result<string>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Handle guest cart
      await ServerGuestCartService.clearCart();

      revalidatePath('/cart');
      return success('Cart cleared');
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

    // Create a new cart with empty items
    const cartData = cart.getCartData();
    const newCartDto = {
      ...cartData,
      items: [],
    };

    const newCart = CartEntity.create(newCartDto);
    const saveResult = await CartRepository.saveCart(newCart);
    if (!saveResult.success) {
      return failure(saveResult.error);
    }

    revalidatePath('/cart');
    return success('Cart cleared');
  } catch (error) {
    console.error('Error clearing cart:', error);
    return failure(new Error('Failed to clear cart'));
  }
}
