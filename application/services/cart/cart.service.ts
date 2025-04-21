import { CartEntity } from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';
import { Result, success, failure } from '@/lib/result';
import { CartDto } from '@/domain/dtos';
import { CartRepository } from '@/infrastructure/repositories/cart.repository';
import { prisma } from '@/infrastructure/prisma/prisma';

export class CartService {
  constructor() {
  }

  static async addItem(
    cartDto: CartDto,
    product: ProductEntity,
    quantity: number = 1,
  ): Promise<Result<CartEntity>> {
    try {

      const cartCreateResult = CartEntity.fromDto(cartDto);
      if (!cartCreateResult.success) {
        return failure(cartCreateResult.error);
      }

      const cart = cartCreateResult.value;

      const addResult = cart.addProduct(product, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }
      return success(addResult.value);
    } catch (error) {
      return failure(new Error('Failed to add item to cart'));
    }
  }

  static async removeItem(
    cartDto: CartDto,
    productId: string,
    quantity: number,
  ): Promise<Result<CartEntity>> {
    try {
      const cartResult = CartEntity.fromDto(cartDto);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      const removeResult = cart.removeProduct(productId, quantity);
      if (!removeResult.success) {
        return failure(removeResult.error);
      }
      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to remove item from cart'));
    }
  }

  static async clearCart(
    cartDto: CartDto,
  ): Promise<Result<CartEntity>> {
    try {
      const cartResult = CartEntity.fromDto(cartDto);
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      cart.cartItems.clear();

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to clear cart'));
    }
  }

  static async loadByUserId(userId: string): Promise<Result<CartEntity>> {
    const cartRepository = new CartRepository(prisma);
    const cartResult = await cartRepository.findByUserId(userId);
    return cartResult;
  }

  static async save(cart: CartEntity): Promise<Result<CartEntity>> {
    const cartRepository = new CartRepository(prisma);
    const result = await cartRepository.save(cart);
    return result;
  }
}
