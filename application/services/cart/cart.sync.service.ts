import { Result, success, failure } from '@/lib/result';
import { ICartStrategy } from '@/domain/interfaces/cart.strategy';
import { CartFactory } from './cart.factory';

export class CartSyncService {
  private guestStrategy: ICartStrategy;
  private userStrategy: ICartStrategy;

  private constructor(guestStrategy: ICartStrategy, userStrategy: ICartStrategy) {
    this.guestStrategy = guestStrategy;
    this.userStrategy = userStrategy;
  }

  static async create(userId: string): Promise<CartSyncService> {
    const guestStrategy = CartFactory.createGuestStrategy();
    const userStrategy = await CartFactory.createUserStrategy(userId);
    return new CartSyncService(guestStrategy, userStrategy);
  }

  async syncGuestCartToUser(): Promise<Result<void>> {
    try {
      // Get guest cart
      const guestCartResult = await this.guestStrategy.getCart();
      if (!guestCartResult.success) {
        return failure(guestCartResult.error);
      }

      const guestCart = guestCartResult.value;
      const guestItems = Array.from(guestCart.getCartDto().cartItemDtos.values());
      if (!guestCart || guestItems.length === 0) {
        return success(undefined);
      }

      // Get user cart
      const userCartResult = await this.userStrategy.getCart();
      if (!userCartResult.success) {
        return failure(userCartResult.error);
      }

      // Merge guest cart items into user cart
      for (const item of guestItems) {
        const addResult = await this.userStrategy.addItem(item.productDto, item.quantity);
        if (!addResult.success) {
          console.warn(`Failed to add product ${item.productId} to user cart:`, addResult.error);
        }
      }

      // Clear guest cart
      const clearResult = await this.guestStrategy.clearCart();
      if (!clearResult.success) {
        return failure(clearResult.error);
      }

      return success(undefined);
    } catch (error) {
      return failure(new Error('Failed to sync guest cart to user'));
    }
  }
}
