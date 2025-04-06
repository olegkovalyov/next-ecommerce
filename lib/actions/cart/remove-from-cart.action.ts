'use server';

import { CartFactory } from '@/application/services/cart/cart.factory';
import { Result } from '@/lib/result';
import { CartItemEntity } from '@/domain/entities/cart-item.entity';

type CartData = {
  id: string;
  userId: string | null;
  items: Array<{
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    qty: number;
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

export async function removeFromCart(productId: string, quantity: number = 1): Promise<Result<CartData>> {
  try {
    const strategy = await CartFactory.createCartStrategy();
    const cartResult = await strategy.getCart();

    if (!cartResult.success) {
      return { success: false, error: cartResult.error };
    }

    const cart = cartResult.value;
    if (!cart) {
      return {
        success: true,
        value: {
          id: crypto.randomUUID(),
          userId: null,
          items: [],
          shippingPrice: 0,
          taxPercentage: 0,
        }
      };
    }

    const removeResult = await strategy.removeItem(productId, quantity);
    if (!removeResult.success) {
      return { success: false, error: removeResult.error };
    }

    const updatedCart = removeResult.value;
    if (!updatedCart) {
      return {
        success: true,
        value: {
          id: crypto.randomUUID(),
          userId: null,
          items: [],
          shippingPrice: 0,
          taxPercentage: 0,
        }
      };
    }

    // Convert Map to array and ensure all data is serializable
    const items = Array.from(updatedCart.items.entries()).map((entry) => {
      const [productId, item] = entry as [string, CartItemEntity];
      return {
        id: item.id,
        cartId: item.cartId,
        productId,
        quantity: item.quantity,
        qty: item.quantity, // For backward compatibility
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: item.product.price,
          images: item.product.images,
          stock: item.product.stock,
        },
      };
    });

    return {
      success: true,
      value: {
        id: updatedCart.id,
        userId: updatedCart.userId,
        items,
        shippingPrice: updatedCart.shippingPrice,
        taxPercentage: updatedCart.taxPercentage,
      }
    };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error: new Error('Failed to remove from cart') };
  }
}
