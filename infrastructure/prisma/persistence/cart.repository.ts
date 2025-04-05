import CartEntity from '@/domain/cart.entity';
import { prisma } from '@/infrastructure/prisma/prisma';
import { Prisma } from '@prisma/client';
import { failure, Result, success } from '@/lib/result';
import { formatError } from '@/lib/utils';
import { CartMapper } from '@/domain/mappers/cart.mapper';

class CartRepository {
  static async saveCart(cart: CartEntity): Promise<Result<CartEntity>> {
    const cartData = cart.getCartData();
    try {
      const prismaCart = CartMapper.toPrisma(cartData);

      const result = await prisma.cart.upsert({
        where: { id: cartData.id },
        update: {
          userId: cartData.userId,
          items: cartData.items as Prisma.CartUpdateitemsInput[],
          shippingPrice: prismaCart.shippingPrice,
          taxPercentage: prismaCart.taxPercentage,
        },
        create: {
          id: cartData.id,
          userId: cartData.userId,
          sessionCartId: cartData.sessionCartId ?? '',
          items: cartData.items as Prisma.CartUpdateitemsInput[],
          shippingPrice: Number(prismaCart.shippingPrice),
          taxPercentage: prismaCart.taxPercentage,
        },
      });

      const updatedCartDto = CartMapper.toDto(result);
      return success(CartEntity.create(updatedCartDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async getCartById(id: string): Promise<Result<CartEntity>> {
    try {
      const cartData = await prisma.cart.findUnique({
        where: { id },
      });

      if (!cartData) {
        return failure(new Error('Cart not found'));
      }

      const cartDto = CartMapper.toDto(cartData);
      return success(CartEntity.create(cartDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }
}

export { CartRepository };
