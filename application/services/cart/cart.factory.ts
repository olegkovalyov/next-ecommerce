import { auth } from '@/infrastructure/auth/auth';
import { GuestCartStrategy } from './guest-cart.strategy';
import { AuthenticatedCartStrategy } from './authenticated-cart.strategy';
import { ICartStrategy } from '@/domain/interfaces/cart.strategy';
import { CartRepository } from '@/infrastructure/repositories/cart.repository';
import { prisma } from '@/infrastructure/prisma/prisma';

export class CartFactory {
  static async createCartStrategy(): Promise<ICartStrategy> {
    const session = await auth();
    const cartRepository = new CartRepository(prisma);

    if (session?.user?.id) {
      return new AuthenticatedCartStrategy(cartRepository, session.user.id);
    }

    return new GuestCartStrategy();
  }

  static createGuestStrategy(): ICartStrategy {
    return new GuestCartStrategy();
  }

  static async createUserStrategy(userId: string): Promise<ICartStrategy> {
    const cartRepository = new CartRepository(prisma);
    return new AuthenticatedCartStrategy(cartRepository, userId);
  }
}
