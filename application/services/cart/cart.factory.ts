import { auth } from '@/infrastructure/auth/auth';
import { PrismaCartRepository } from '@/infrastructure/repositories/prisma-cart.repository';
import { GuestCartStrategy } from './guest-cart.strategy';
import { AuthenticatedCartStrategy } from './authenticated-cart.strategy';
import { ICartStrategy } from '@/domain/interfaces/cart.strategy';

export class CartFactory {
  static async createCartStrategy(): Promise<ICartStrategy> {
    const session = await auth();
    const cartRepository = new PrismaCartRepository();

    if (session?.user?.id) {
      return new AuthenticatedCartStrategy(cartRepository, session.user.id);
    }

    return new GuestCartStrategy();
  }

  static createGuestStrategy(): ICartStrategy {
    return new GuestCartStrategy();
  }

  static async createUserStrategy(userId: string): Promise<ICartStrategy> {
    const cartRepository = new PrismaCartRepository();
    return new AuthenticatedCartStrategy(cartRepository, userId);
  }
} 