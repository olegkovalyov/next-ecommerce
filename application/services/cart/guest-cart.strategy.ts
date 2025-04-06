import { ICartStrategy } from '@/domain/interfaces/cart.strategy';
import { CartEntity } from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';
import { Result, success, failure } from '@/lib/result';
import { CartDto } from '@/domain/dtos';
import { cookies } from 'next/headers';

const CART_KEY = 'guest_cart';

export class GuestCartStrategy implements ICartStrategy {
  private readonly cartId: string;

  constructor() {
    this.cartId = crypto.randomUUID();
  }

  private async getCartFromCookies(): Promise<Result<CartDto>> {
    try {
      const cookieStore = await cookies();
      const cartCookie = cookieStore.get(CART_KEY);
      
      if (!cartCookie) {
        return success({
          id: this.cartId,
          userId: null,
          shippingPrice: 0,
          taxPercentage: 0,
          cartItemDtos: [],
        });
      }

      return success(JSON.parse(cartCookie.value));
    } catch (error) {
      return failure(new Error('Failed to get cart from cookies'));
    }
  }

  private async saveCartToCookies(cart: CartDto): Promise<Result<void>> {
    try {
      const cookieStore = await cookies();
      cookieStore.set(CART_KEY, JSON.stringify(cart), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });
      return success(undefined);
    } catch (error) {
      return failure(new Error('Failed to save cart to cookies'));
    }
  }

  async getCart(): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCartFromCookies();
      if (!cartResult.success) {
        return failure(cartResult.error);
      }

      return CartEntity.fromDto(cartResult.value);
    } catch (error) {
      return failure(new Error('Failed to get cart'));
    }
  }

  async addItem(product: ProductEntity, quantity: number): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      const addResult = cart.addProduct(product, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }

      const saveResult = await this.saveCartToCookies(cart.toDto());
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to add item to cart'));
    }
  }

  async removeItem(productId: string, quantity: number): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      const removeResult = cart.removeProduct(productId, quantity);
      if (!removeResult.success) {
        return failure(removeResult.error);
      }

      const saveResult = await this.saveCartToCookies(cart.toDto());
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to remove item from cart'));
    }
  }

  async updateItem(productId: string, quantity: number): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      const existingItem = Array.from(cart.cartItems.values()).find(item => item.productId === productId);

      if (!existingItem) {
        return failure(new Error('Product not found in cart'));
      }

      // First remove the item completely
      cart.removeProduct(productId, existingItem.quantity);

      // Then add it back with the new quantity
      const addResult = cart.addProduct(existingItem.product, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }

      const saveResult = await this.saveCartToCookies(cart.toDto());
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to update cart item'));
    }
  }

  async clearCart(): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      cart.cartItems.clear();

      const saveResult = await this.saveCartToCookies(cart.toDto());
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to clear cart'));
    }
  }
}
