import { CartEntity } from '@/domain/entities/cart.entity';
import { CartMapper, CartWithItems } from './mappers/cart.mapper';
import { failure, Result } from '@/lib/result';
import { PrismaClient } from '@prisma/client';

export class CartRepository {
  constructor(private readonly prisma: PrismaClient) {
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

  async findByUserId(userId: string): Promise<Result<CartEntity | null>> {
    try {
      const data = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!data) {
        return { success: true, value: null };
      }

      return CartEntity.fromDto(CartMapper.toDto(data as unknown as CartWithItems));
    } catch (error) {
      return failure(new Error('Cart not found'));
    }
  }

  async save(cart: CartEntity): Promise<Result<CartEntity>> {
    try {
      const { items: prismaItems } = CartMapper.toPrismaWithItems(cart.toDto());

      // First, create or update the cart
       await this.prisma.cart.upsert({
        where: { id: cart.id },
        create: {
          id: cart.id,
          userId: cart.userId,
        },
        update: {},
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Then, handle the items
      if (prismaItems.length > 0) {
        // Delete existing items
        await this.prisma.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        // Create new items
        await this.prisma.cartItem.createMany({
          data: prismaItems.map(item => ({
            cartId: cart.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }

      // Fetch the updated cart with items
      const updatedCart = await this.prisma.cart.findUnique({
        where: { id: cart.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!updatedCart) {
        return failure(new Error('Failed to fetch updated cart'));
      }

      return CartEntity.fromDto(CartMapper.toDto(updatedCart as unknown as CartWithItems));
    } catch (error) {
      // In test environment, errors are expected and handled by the test cases
      if (process.env.NODE_ENV !== 'test') {
        console.error('Failed to save cart:', error);
      }
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
