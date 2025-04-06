import { cookies } from 'next/headers';
import { Result, success, failure } from '@/lib/result';
import { ICartStrategy } from '@/domain/interfaces/cart.strategy';
import CartEntity from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';

const CART_KEY = 'guest_cart';

type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  image: string;
};

export class GuestCartStrategy implements ICartStrategy {
  private static async getCartItems(): Promise<CartItem[]> {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_KEY);
    return cartCookie ? JSON.parse(cartCookie.value) : [];
  }

  private static async saveCartItems(cartItems: CartItem[]) {
    const cookieStore = await cookies();
    cookieStore.set(CART_KEY, JSON.stringify(cartItems), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });
  }

  private static async clearCartItems() {
    const cookieStore = await cookies();
    cookieStore.delete(CART_KEY);
  }

  async getCart(): Promise<Result<CartEntity>> {
    try {
      const cartItems = await GuestCartStrategy.getCartItems();
      const cartDto = {
        id: crypto.randomUUID(),
        userId: null,
        shippingPrice: 0,
        taxPercentage: 0,
        items: cartItems.map(item => ({
          id: crypto.randomUUID(),
          cartId: crypto.randomUUID(),
          productId: item.productId,
          quantity: item.qty,
          product: {
            id: item.productId,
            name: item.name,
            slug: item.slug,
            price: item.price,
            images: [item.image],
            stock: 999, // Default stock for guest cart
          } as ProductEntity,
        })),
      };
      return success(CartEntity.create(cartDto));
    } catch (error) {
      return failure(new Error('Failed to get cart'));
    }
  }

  async addItem(product: ProductEntity, quantity: number = 1): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      cart.addProduct(product, quantity);

      // Save the updated cart
      const cartData = cart.getCartDto();
      const cartItems = Array.from(cartData.cartItemDtos.values()).map(item => ({
        productId: item.productId,
        name: item.productDto.name,
        slug: item.productDto.slug,
        price: item.productDto.price,
        qty: item.quantity,
        image: item.productDto.images[0] || '',
      }));
      await GuestCartStrategy.saveCartItems(cartItems);

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to add item to cart'));
    }
  }

  async removeItem(productId: string, quantity: number = 1): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      cart.removeProduct(productId, quantity);

      // Save the updated cart
      const cartData = cart.getCartDto();
      const cartItems = Array.from(cartData.cartItemDtos.values()).map(item => ({
        productId: item.productId,
        name: item.productDto.name,
        slug: item.productDto.slug,
        price: item.productDto.price,
        qty: item.quantity,
        image: item.productDto.images[0] || '',
      }));
      await GuestCartStrategy.saveCartItems(cartItems);

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
      const existingItem = cart.getCartDto().cartItemDtos.find(item => item.productId === productId);

      if (!existingItem) {
        return failure(new Error('Product not found in cart'));
      }

      // First remove the item completely
      cart.removeProduct(productId, existingItem.quantity);

      // Then add it back with the new quantity
      const addResult = cart.addProduct(existingItem.productDto, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }

      // Save the updated cart
      const cartData = cart.getCartDto();
      const cartItems = Array.from(cartData.cartItemDtos.values()).map(item => ({
        productId: item.productId,
        name: item.productDto.name,
        slug: item.productDto.slug,
        price: item.productDto.price,
        qty: item.quantity,
        image: item.productDto.images[0] || '',
      }));
      await GuestCartStrategy.saveCartItems(cartItems);

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to update item in cart'));
    }
  }

  async clearCart(): Promise<Result<void>> {
    try {
      await GuestCartStrategy.clearCartItems();
      return success(undefined);
    } catch (error) {
      return failure(new Error('Failed to clear cart'));
    }
  }
}
