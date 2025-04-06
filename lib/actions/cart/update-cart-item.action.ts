'use server';

import { auth } from '@/infrastructure/auth/auth';
import { CartFactory } from '@/application/services/cart/concrete/cart.factory';
import { PrismaCartRepository } from '@/infrastructure/repositories/prisma-cart.repository';
import { ServerGuestCartService } from '@/application/services/cart/server-guest-cart.service';
import { Result, success, failure } from '@/lib/result';
import CartEntity from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';

type CartData = {
  id: string;
  userId: string | null;
  items: Array<{
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
      images: string[];
      stock: number;
    };
  }>;
  shippingPrice: number;
  taxPercentage: number;
};

export async function updateCartItem(productId: string, quantity: number): Promise<Result<CartEntity>> {
  try {
    const strategy = await CartFactory.createCartStrategy();
    return await strategy.updateItem(productId, quantity);
  } catch (error) {
    return { success: false, error: new Error('Failed to update cart item') };
  }
}

async function getOrCreateCart(userId: string | undefined): Promise<Result<CartEntity>> {
  if (userId) {
    // User is authenticated, try to load their cart
    const cartResult = await CartService.loadCart(userId);
    if (!cartResult.success) {
      // If cart doesn't exist, create a new one
      const cart = CartService.createCart(userId);
      const saveResult = await CartService.saveCart(cart);
      if (!saveResult.success) {
        return failure(new Error('Failed to create cart'));
      }
      return success(cart);
    }
    return cartResult;
  } else {
    // User is not authenticated, create a new cart
    return success(CartService.createCart(crypto.randomUUID()));
  }
}
