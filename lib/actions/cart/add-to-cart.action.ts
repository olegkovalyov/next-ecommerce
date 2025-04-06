'use server';

import { CartFactory } from '@/application/services/cart/concrete/cart.factory';
import { failure, Result, success } from '@/lib/result';
import { CartDto, ProductDto } from '@/domain/dtos';
import { ProductEntity } from '@/domain/entities/product.entity';

export async function addToCart(productDto: ProductDto, quantity: number = 1): Promise<Result<CartDto>> {
  try {
    const strategy = await CartFactory.createCartStrategy();
    const cartResult = await strategy.getCart();

    if (!cartResult.success) {
      return failure(cartResult.error);
    }

    const createProductResult = ProductEntity.fromDto(productDto);
    if (!createProductResult.success) {
      return failure(createProductResult.error);
    }

    const addResult = await strategy.addItem(createProductResult.value, quantity);
    if (!addResult.success) {
      return failure(addResult.error);
    }

    const updatedCart = addResult.value;
    return success(updatedCart.toDto());
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: new Error('Failed to add to cart') };
  }
}
