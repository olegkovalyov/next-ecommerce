import CartEntity from '@/domain/entities/cart.entity';
import { prisma } from '@/infrastructure/prisma/prisma';
import { Prisma } from '@prisma/client';
import { failure, Result, success } from '@/lib/result';
import { formatError } from '@/lib/utils';
import { CartMapper } from '@/domain/mappers/cart.mapper';
import { CartItemDto } from '@/domain/entities/cart-item.entity';

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

class CartRepository {

  static async loadCartItemsByUserId(userId: string): Promise<Result<CartItemDto[]>> {
    try {
      const cartResult = await this.loadCartByUserId(userId);
      if (!cartResult.success) {
        return success([]);
      }

      const cartItems = cartResult.value.getCartDto().cartItemDtos;
      return success(cartItems);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async saveCart(cart: CartEntity): Promise<Result<CartEntity>> {
    const cartData = cart.getCartDto();
    try {
      const prismaCart = CartMapper.toPrisma(cartData);

      const result = await prisma.$transaction(async (tx) => {
        // Update or create cart
        const savedCart = await tx.cart.upsert({
          where: { id: cartData.id },
          update: {
            userId: cartData.userId,
            shippingPrice: prismaCart.shippingPrice,
            taxPercentage: prismaCart.taxPercentage,
          },
          create: {
            id: cartData.id,
            userId: cartData.userId,
            shippingPrice: Number(prismaCart.shippingPrice),
            taxPercentage: prismaCart.taxPercentage,
          },
        });

        // Delete existing cart items
        await tx.cartItem.deleteMany({
          where: { cartId: savedCart.id },
        });

        // Create new cart items
        if (cartData.cartItemDtos.length > 0) {
          await tx.cartItem.createMany({
            data: cartData.cartItemDtos.map(item => ({
              cartId: savedCart.id,
              productId: item.productId,
              quantity: item.quantity,
            })),
          });
        }

        // Return cart with items
        const cartWithItems = await tx.cart.findUnique({
          where: { id: savedCart.id },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return cartWithItems;
      });

      if (!result) {
        return failure(new Error('Failed to save cart'));
      }

      const updatedCartDto = CartMapper.toDto(result as CartWithItems);
      const updatedCart = CartEntity.create(updatedCartDto);
      return success(updatedCart);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async loadCartById(id: string): Promise<Result<CartEntity>> {
    try {
      const cartData = await prisma.cart.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cartData) {
        return failure(new Error('Cart not found'));
      }

      const cartDto = CartMapper.toDto(cartData as CartWithItems);
      return success(CartEntity.create(cartDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async loadCartByUserId(userId: string): Promise<Result<CartEntity>> {
    try {
      const cartData = await prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cartData) {
        return failure(new Error('Cart not found'));
      }

      const cartDto = CartMapper.toDto(cartData as CartWithItems);
      const cart = CartEntity.create(cartDto);
      return success(cart);
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async addCartItem(cartId: string, item: CartItemDto): Promise<Result<CartEntity>> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Add or update cart item
        await tx.cartItem.upsert({
          where: {
            cartId_productId: {
              cartId,
              productId: item.productId,
            },
          },
          update: {
            quantity: {
              increment: item.quantity,
            },
          },
          create: {
            cartId,
            productId: item.productId,
            quantity: item.quantity,
          },
        });

        // Return updated cart
        const cartWithItems = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return cartWithItems;
      });

      if (!result) {
        return failure(new Error('Failed to add item to cart'));
      }

      const cartDto = CartMapper.toDto(result as CartWithItems);
      return success(CartEntity.create(cartDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async removeCartItem(cartId: string, productId: string, quantity: number = 1): Promise<Result<CartEntity>> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const cartItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId,
              productId,
            },
          },
        });

        if (!cartItem) {
          throw new Error('Item not found in cart');
        }

        if (cartItem.quantity <= quantity) {
          // Remove item if quantity to remove is greater than or equal to current quantity
          await tx.cartItem.delete({
            where: {
              cartId_productId: {
                cartId,
                productId,
              },
            },
          });
        } else {
          // Update quantity if removing less than current quantity
          await tx.cartItem.update({
            where: {
              cartId_productId: {
                cartId,
                productId,
              },
            },
            data: {
              quantity: {
                decrement: quantity,
              },
            },
          });
        }

        // Return updated cart
        const cartWithItems = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return cartWithItems;
      });

      if (!result) {
        return failure(new Error('Failed to remove item from cart'));
      }

      const cartDto = CartMapper.toDto(result as CartWithItems);
      return success(CartEntity.create(cartDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }

  static async clearCart(cartId: string): Promise<Result<CartEntity>> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Delete all cart items
        await tx.cartItem.deleteMany({
          where: { cartId },
        });

        // Return updated cart
        const cartWithItems = await tx.cart.findUnique({
          where: { id: cartId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        return cartWithItems;
      });

      if (!result) {
        return failure(new Error('Failed to clear cart'));
      }

      const cartDto = CartMapper.toDto(result as CartWithItems);
      return success(CartEntity.create(cartDto));
    } catch (error: unknown) {
      return failure(new Error(formatError(error)));
    }
  }
}

export { CartRepository };
