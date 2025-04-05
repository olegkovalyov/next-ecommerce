import { ProductEntity } from '@/domain/product.entity';
import { cookies } from 'next/headers';

const CART_KEY = 'guest_cart';

type CartItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  qty: number;
  image: string;
};

export class ServerGuestCartService {
  static async getCartItems(): Promise<CartItem[]> {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_KEY);
    return cartCookie ? JSON.parse(cartCookie.value) : [];
  }

  static async addItem(product: ProductEntity, quantity: number = 1) {
    const cart = await this.getCartItems();
    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.qty += quantity;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        qty: quantity,
        image: product.images[0] || '',
      });
    }

    await this.saveCartItems(cart);
  }

  static async removeItem(
    productId: string,
    shouldRemoveAll: boolean = false,
  ): Promise<void> {
    const cartItems = await this.getCartItems();
    cartItems.forEach((cartItem) => {
      if (cartItem.productId === productId) {
        cartItem.qty--;
      }
    });
    const updatedCartItems = cartItems.filter((cartItem) => {
      if (shouldRemoveAll) {
        return cartItem.productId !== productId;
      } else {
        return cartItem.qty > 0;
      }
    });
    await this.saveCartItems(updatedCartItems);
  }

  static async clearCart() {
    const cookieStore = await cookies();
    cookieStore.delete(CART_KEY);
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
}
