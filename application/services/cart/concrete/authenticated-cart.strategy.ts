import { Result, success, failure } from '@/lib/result';
import { CartStrategyInterface } from '../abstract/cart.strategy';
import { CartRepositoryInterface } from '@/application/services/cart/abstract/cart.repository';
import { CartEntity } from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';
import { CartDto } from '@/domain/dtos';

export class AuthenticatedCartStrategy implements CartStrategyInterface {
  constructor(
    private readonly cartRepository: CartRepositoryInterface,
    private readonly userId: string,
  ) {
  }

  async getCart(): Promise<Result<CartEntity>> {
    try {
      return await this.cartRepository.findByUserId(this.userId);
    } catch (error) {
      return failure(new Error('Failed to get cart'));
    }
  }

  async addItem(
    cartDto: CartDto,
    product: ProductEntity,
    quantity: number): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      const addResult = cart.addProduct(product, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }

      const saveResult = await this.cartRepository.save(cart);
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to add item to cart'));
    }
  }

  async removeItem(
    cartDto: CartDto,
    productId: string,
    quantity: number,
  ): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      cart.removeProduct(productId, quantity);

      const saveResult = await this.cartRepository.save(cart);
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to remove item from cart'));
    }
  }

  async clearCart(): Promise<Result<CartEntity>> {
    try {
      return await this.cartRepository.delete(this.userId);
    } catch (error) {
      return failure(new Error('Failed to clear cart'));
    }
  }
}
