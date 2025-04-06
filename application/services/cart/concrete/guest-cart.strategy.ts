import { CartStrategyInterface } from '@/application/services/cart/abstract/cart.strategy';
import { CartEntity } from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';
import { Result, success, failure } from '@/lib/result';
import { CartDto, CartItemDto } from '@/domain/dtos';
import { cookies } from 'next/headers';
import { CART_KEY } from '@/lib/constants';
import { CookieCart } from '@/application/services/cart/abstract/cookie-cart.interface';
import { ProductService } from '@/application/services/product/product.service';

export class GuestCartStrategy implements CartStrategyInterface {
  private readonly cartId: string;

  constructor() {
    this.cartId = crypto.randomUUID();
  }

  private async getCookieCartItems(): Promise<Result<CookieCart>> {
    try {
      const cookieStore = await cookies();
      const cookieCartItems = cookieStore.get(CART_KEY);
      if (!cookieCartItems) {
        return failure(new Error('Failed to get cart from cookies'));
      }

      return success(JSON.parse(cookieCartItems.value));
    } catch (error) {
      return failure(new Error('Failed to get cart from cookies'));
    }
  }

  private async saveCartItemsToCookies(cart: CartDto): Promise<Result<void>> {
    try {
      const cartItemsInCookie = cart.cartItemDtos.map(item => {
        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
        };
      });
      const cookieCart: CookieCart = {
        id: cart.id,
        cartItems: cartItemsInCookie,
      };
      const cookieStore = await cookies();
      cookieStore.set(CART_KEY, JSON.stringify(cookieCart), {
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
      const cookieCartItemsResult = await this.getCookieCartItems();
      const cartItemDtos = [];
      if (cookieCartItemsResult.success) {
        const cookieCartItems = cookieCartItemsResult.value;
        const productService = new ProductService();
        for (const item of cookieCartItems.cartItems) {
          const productResult = await productService.loadProductById(item.productId);
          if (!productResult.success) {
            continue;
          }
          const product = productResult.value;
          const cartItemDto = new CartItemDto(
            item.id,
            cookieCartItems.id,
            item.productId,
            item.quantity,
            product.toDto(),
          );
          cartItemDtos.push(cartItemDto);
        }
      }

      const cartId = cookieCartItemsResult.success
        ? cookieCartItemsResult.value.id
        : crypto.randomUUID();

      const cartDto = new CartDto(
        cartId,
        '',
        0,
        0,
        cartItemDtos,
      );
      return CartEntity.fromDto(cartDto);
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

      const saveResult = await this.saveCartItemsToCookies(cart.toDto());
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

      const saveResult = await this.saveCartItemsToCookies(cart.toDto());
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

      const saveResult = await this.saveCartItemsToCookies(cart.toDto());
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

      const saveResult = await this.saveCartItemsToCookies(cart.toDto());
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to clear cart'));
    }
  }
}
