import { PrismaClient } from '@prisma/client';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartMapper, CartWithItems } from './mappers/cart.mapper';
import { success, failure, Result } from '@/lib/result';
import { prisma } from '@/infrastructure/prisma/prisma';

type ExtendedPrismaClient = typeof prisma;

export class CartRepository {
  constructor(private readonly prisma: ExtendedPrismaClient) {
  }

  async findById(id: string): Promise<Result<CartEntity>> {
    try {
      const data = await this.prisma.cart.findUniqueOrThrow({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return CartEntity.fromDto(CartMapper.toDto(data as unknown as CartWithItems));
    } catch (error) {
      return failure(new Error('Cart not found'));
    }
  }

  async findByUserId(userId: string): Promise<Result<CartEntity>> {
    try {
      const data = await this.prisma.cart.findFirstOrThrow({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return CartEntity.fromDto(CartMapper.toDto(data as unknown as CartWithItems));
    } catch (error) {
      return failure(new Error('Cart not found'));
    }
  }

  async save(cart: CartEntity): Promise<Result<CartEntity>> {
    try {
      const { cart: prismaCart, items: prismaItems } = CartMapper.toPrismaWithItems(cart.toDto());

      const data = await this.prisma.cart.upsert({
        where: { id: cart.id },
        create: {
          id: cart.id,
          ...prismaCart,
          items: {
            create: prismaItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        update: {
          ...prismaCart,
          items: {
            deleteMany: {},
            create: prismaItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return CartEntity.fromDto(CartMapper.toDto(data as unknown as CartWithItems));
    } catch (error) {
      return failure(new Error('Failed to save cart'));
    }
  }

  async delete(id: string): Promise<Result<CartEntity>> {
    try {

      const cart = await this.findById(id);

      if (!cart.success) {
        return cart;
      }

      await this.prisma.cart.delete({
        where: { id },
      });
      return cart;
    } catch (error) {
      return failure(new Error('Failed to delete cart'));
    }
  }
}
