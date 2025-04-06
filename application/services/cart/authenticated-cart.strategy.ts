import { Result, success, failure } from '@/lib/result';
import { ICartStrategy } from './cart.strategy';
import { ICartRepository } from '@/domain/interfaces/cart.repository';
import { CartEntity } from '@/domain/entities/cart.entity';
import { ProductEntity } from '@/domain/entities/product.entity';

export class AuthenticatedCartStrategy implements ICartStrategy {
  constructor(
    private readonly cartRepository: ICartRepository,
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

  async addItem(product: ProductEntity, quantity: number): Promise<Result<CartEntity>> {
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

  async removeItem(productId: string, quantity: number): Promise<Result<CartEntity>> {
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

  async updateItem(productId: string, quantity: number): Promise<Result<CartEntity>> {
    try {
      const cartResult = await this.getCart();
      if (!cartResult.success) {
        return cartResult;
      }

      const cart = cartResult.value;
      const existingItem = cart.toDto().cartItemDtos.find(item => item.productId === productId);

      if (!existingItem) {
        return failure(new Error('Product not found in cart'));
      }

      // First remove the item completely
      cart.removeProduct(productId, existingItem.quantity);

      // Then add it back with the new quantity
      const createProductResult = ProductEntity.fromDto(existingItem.productDto);
      if (!createProductResult.success) {
        return failure(createProductResult.error);
      }
      const addResult = cart.addProduct(createProductResult.value, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }

      const saveResult = await this.cartRepository.save(cart);
      if (!saveResult.success) {
        return failure(saveResult.error);
      }

      return success(cart);
    } catch (error) {
      return failure(new Error('Failed to update cart item'));
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
