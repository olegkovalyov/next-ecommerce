import { auth } from '@/infrastructure/auth/auth';
import { GuestCartStrategy } from './guest-cart.strategy';
import { AuthenticatedCartStrategy } from './authenticated-cart.strategy';
import { CartStrategyInterface } from '@/application/services/cart/abstract/cart.strategy';
import { CartRepository } from '@/infrastructure/repositories/cart.repository';
import { prisma } from '@/infrastructure/prisma/prisma';

export class CartFactory {
  static async createCartStrategy(): Promise<CartStrategyInterface> {
    const session = await auth();
    const cartRepository = new CartRepository(prisma);

    if (session?.user?.id) {
      return new AuthenticatedCartStrategy(cartRepository, session.user.id);
    }

    return new GuestCartStrategy();
  }

  static createGuestStrategy(): CartStrategyInterface {
    return new GuestCartStrategy();
  }

  static async createUserStrategy(userId: string): Promise<CartStrategyInterface> {
    const cartRepository = new CartRepository(prisma);
    return new AuthenticatedCartStrategy(cartRepository, userId);
  }
}
