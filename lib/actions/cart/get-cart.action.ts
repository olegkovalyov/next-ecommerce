'use server';

import { auth } from '@/infrastructure/auth/auth';
import { Result } from '@/lib/result';
import { CartFactory } from '@/application/services/cart/concrete/cart.factory';
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


export async function getCart(): Promise<Result<CartData>> {
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

    // Convert Map to array and ensure all data is serializable
    const items = Array.from(cart.items.entries()).map((entry) => {
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
        id: cart.id,
        userId: cart.userId,
        items,
        shippingPrice: cart.shippingPrice,
        taxPercentage: cart.taxPercentage,
      }
    };
  } catch (error) {
    console.error('Error getting cart:', error);
    return { success: false, error: new Error('Failed to get cart') };
  }
}
