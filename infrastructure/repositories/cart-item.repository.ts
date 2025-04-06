import { CartItemEntity } from '@/domain/entities/cart-item.entity';
import { CartItemMapper } from './mappers/cart-item.mapper';
import { prisma } from '@/infrastructure/prisma/prisma';
import { failure, Result } from '@/lib/result';

type ExtendedPrismaClient = typeof prisma;

export class CartItemRepository {
  constructor(private readonly prisma: ExtendedPrismaClient) {
  }

  async findById(id: string): Promise<Result<CartItemEntity>> {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!cartItem) {
      return failure(new Error('Failed to load cart item'));
    }

    return CartItemEntity.fromDto(CartItemMapper.toDto(cartItem));
  }

  async findByCartId(cartId: string): Promise<Result<CartItemEntity>> {
    try {
      const cartItem = await this.prisma.cartItem.findFirstOrThrow({
        where: { cartId },
        include: { product: true },
      });

      if (!cartItem) {
        return failure(new Error('Failed to load cart item'));
      }

      return CartItemEntity.fromDto(CartItemMapper.toDto(cartItem));
    } catch (error: unknown) {
      return failure(new Error('Failed to load cart item'));
    }
  }

  async save(cartItem: CartItemEntity): Promise<Result<CartItemEntity>> {
    const cartItemDto = cartItem.toDto();
    const prismaData = CartItemMapper.toPrisma(cartItemDto);

    try {
      const savedCartItem = await this.prisma.cartItem.upsert({
        where: { id: cartItemDto.id },
        create: prismaData,
        update: prismaData,
        include: { product: true },
      });

      return CartItemEntity.fromDto(CartItemMapper.toDto(savedCartItem));
    } catch (error: unknown) {
      return failure(new Error('Failed to save cart item'));
    }
  }

  async delete(id: string): Promise<Result<CartItemEntity>> {
    const cartItem = await this.findById(id);

    if (!cartItem.success) {
      return cartItem;
    }

    try {
      await this.prisma.cartItem.delete({
        where: { id },
      });

      return cartItem;
    } catch (error: unknown) {
      return failure(new Error('Failed to delete cart item'));
    }
  }
}
