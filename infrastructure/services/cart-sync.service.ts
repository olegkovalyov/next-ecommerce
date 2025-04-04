import { GuestCartService } from './guest-cart.service';
import { CartLoader } from './cart.loader';
import { CartRepository } from '../persistence/cart.repository';
import { Result, success, failure } from '@/lib/result';
import { CartItem } from '@/lib/contracts/cart';
import { ProductEntity } from '@/domain/product.entity';

export class CartSyncService {
  static async syncGuestCartToUser(userId: string): Promise<Result<void>> {
    try {
      // 1. Get guest cart items
      const guestCartItems = GuestCartService.getCart();
      console.log(guestCartItems);
      if (guestCartItems.length === 0) {
        return success(undefined);
      }

      // 2. Load or create user cart
      const cartResult = await CartLoader.loadOrCreateCart();
      if (!cartResult.success) {
        return failure(cartResult.error);
      }

      const cart = cartResult.value;
      if (!cart) {
        return failure(new Error('Failed to create cart'));
      }

      // 3. Add guest items to user cart
      for (const item of guestCartItems) {
        const product = new ProductEntity({
          id: item.productId,
          name: item.name,
          slug: item.slug,
          price: item.price,
          images: [item.image],
          stock: 100, // This should come from the product data
          description: '', // Required by ProductEntity but not used in cart
          category: '', // Required by ProductEntity but not used in cart
          brand: '', // Required by ProductEntity but not used in cart
          rating: '0', // Required by ProductEntity but not used in cart
          numReviews: 0, // Required by ProductEntity but not used in cart
          isFeatured: false, // Required by ProductEntity but not used in cart
          banner: null, // Required by ProductEntity but not used in cart
          createdAt: new Date(), // Required by ProductEntity but not used in cart
        });
        const addResult = cart.addProduct(product, item.qty);
        if (!addResult.success) {
          return failure(addResult.error);
        }
      }

      // 4. Save updated cart
      const saveResult = await CartRepository.saveCart(cart);
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      // 5. Clear guest cart
      GuestCartService.clearCart();

      return success(undefined);
    } catch (error) {
      return failure(new Error('Failed to sync guest cart'));
    }
  }

  static async loadUserCartToGuest(userId: string): Promise<Result<void>> {
    try {
      // 1. Get user cart
      const cartResult = await CartLoader.loadOrCreateCart();
      if (!cartResult.success) {
        return failure(cartResult.error);
      }

      const cart = cartResult.value;
      if (!cart) {
        return failure(new Error('Failed to load cart'));
      }

      const cartData = cart.getCartData();

      // 2. Convert cart items to guest cart format
      const guestCartItems: CartItem[] = cartData.items.map(item => ({
        productId: item.productId,
        name: item.name,
        slug: item.slug,
        price: item.price,
        qty: item.qty,
        image: item.image,
      }));

      // 3. Clear existing guest cart and add new items
      GuestCartService.clearCart();
      for (const item of guestCartItems) {
        GuestCartService.addItem(
          new ProductEntity({
            id: item.productId,
            name: item.name,
            slug: item.slug,
            price: item.price,
            images: [item.image],
            stock: 100, // This should come from the product data
            description: '', // Required by ProductEntity but not used in cart
            category: '', // Required by ProductEntity but not used in cart
            brand: '', // Required by ProductEntity but not used in cart
            rating: '0', // Required by ProductEntity but not used in cart
            numReviews: 0, // Required by ProductEntity but not used in cart
            isFeatured: false, // Required by ProductEntity but not used in cart
            banner: null, // Required by ProductEntity but not used in cart
            createdAt: new Date(), // Required by ProductEntity but not used in cart
          }),
          item.qty,
        );
      }

      return success(undefined);
    } catch (error) {
      return failure(new Error('Failed to load user cart to guest'));
    }
  }
}
