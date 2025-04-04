import { CartItem } from '@/lib/contracts/cart';
import { ProductEntity } from '@/domain/product.entity';

export class GuestCartService {
  private static readonly CART_KEY = 'guest_cart';

  static getCart(): CartItem[] {
    if (typeof window === 'undefined') return [];

    const cartJson = localStorage.getItem(this.CART_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
  }

  static addItem(product: ProductEntity, quantity: number = 1): CartItem[] {
    console.log('Guest cart system: ',product);
    const cart = this.getCart();
    const existingItem = cart.find(item => item.productId === product.id);

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

    this.saveCart(cart);
    return cart;
  }

  static removeItem(productId: string, quantity: number = 1): CartItem[] {
    const cart = this.getCart();
    const itemIndex = cart.findIndex(item => item.productId === productId);

    if (itemIndex !== -1) {
      const item = cart[itemIndex];
      if (item.qty <= quantity) {
        cart.splice(itemIndex, 1);
      } else {
        item.qty -= quantity;
      }
    }

    this.saveCart(cart);
    return cart;
  }

  static clearCart(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.CART_KEY);
  }

  private static saveCart(cart: CartItem[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
  }
}
