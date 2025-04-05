import { prisma } from '@/db/prisma';
import CartEntity, { CartDto } from '@/domain/cart.entity';
import { Result, success, failure } from '@/lib/result';
import { CartMapper } from '@/domain/mappers/cart.mapper';
import { ServerGuestCartService } from './server-guest-cart.service';
import { auth } from '@/auth';

export class CartService {
  static async loadOrCreateCart(): Promise<Result<CartEntity | null>> {
    try {
      const session = await auth();

      if (!session?.user?.id) {
        // Load guest cart
        const guestCartItems = await ServerGuestCartService.getCartItems();
        const guestCartDto: CartDto = {
          id: 'guest',
          sessionCartId: 'guest',
          userId: null,
          shippingPrice: 0,
          taxPercentage: 0,
          items: guestCartItems,
        };
        return success(CartEntity.create(guestCartDto));
      }

      // Load user cart
      const cartData = await prisma.cart.findFirst({
        where: { userId: session.user.id },
      });

      if (cartData) {
        const cartDto = CartMapper.toDto(cartData);
        return success(CartEntity.create(cartDto));
      }

      // Create new cart if none exists
      const newCartDto: CartDto = {
        id: crypto.randomUUID(),
        sessionCartId: crypto.randomUUID(),
        userId: session.user.id,
        shippingPrice: 0,
        taxPercentage: 0,
        items: [],
      };

      return success(CartEntity.create(newCartDto));
    } catch (error) {
      return failure(new Error('Failed to load cart'));
    }
  }
}
