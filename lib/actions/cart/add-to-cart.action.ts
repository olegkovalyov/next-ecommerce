'use server';

import { failure, Result, success } from '@/lib/result';
import { CartDto, ProductDto } from '@/domain/dtos';
import { ProductEntity } from '@/domain/entities/product.entity';
import { CartService } from '@/application/services/cart/cart.service';

export async function addToCart(
  cartDto: CartDto,
  productDto: ProductDto,
): Promise<Result<CartDto>> {
  try {
    const createProductResult = ProductEntity.fromDto(productDto);
    if (!createProductResult.success) {
      return failure(createProductResult.error);
    }


    const addResult = await CartService.addItem(
      cartDto,
      createProductResult.value);
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
