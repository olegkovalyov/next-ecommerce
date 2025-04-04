import { CartDto } from '../cart.entity';
import { Cart as PrismaCart, Prisma } from '@prisma/client';

export class CartMapper {
  static toDto(prismaCart: PrismaCart): CartDto {
    return {
      id: prismaCart.id,
      sessionCartId: prismaCart.sessionCartId,
      userId: prismaCart.userId,
      shippingPrice: Number(prismaCart.shippingPrice),
      taxPercentage: Number(prismaCart.taxPercentage),
      items: prismaCart.items as CartDto['items'],
    };
  }

  static toPrisma(cartDto: CartDto): Partial<PrismaCart> {
    return {
      id: cartDto.id,
      sessionCartId: cartDto.sessionCartId,
      userId: cartDto.userId,
      shippingPrice: new Prisma.Decimal(cartDto.shippingPrice),
      taxPercentage: new Prisma.Decimal(cartDto.taxPercentage),
      items: cartDto.items as any,
    };
  }

  private static calculateTotalItems(items: CartDto['items']): number {
    return items.reduce((total, item) => total + item.qty, 0);
  }
}
