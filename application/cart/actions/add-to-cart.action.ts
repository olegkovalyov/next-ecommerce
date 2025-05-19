'use server';

import { failure, Result } from '@/lib/result';
import { CartDto, ProductDto } from '@/domain/dtos';
import { ProductEntity } from '@/domain/entities/product.entity';
import { Container } from '@/lib/di';

import { handleCartAction } from '../utils/handle-cart-action';

export async function addToCart(
  cartDto: CartDto,
  productDto: ProductDto,
): Promise<Result<CartDto>> {
  return handleCartAction(async () => {
    const createProductResult = ProductEntity.fromDto(productDto);
    if (!createProductResult.success) {
      return failure(createProductResult.error);
    }
    return Container.getInstance().getCartService().addItem(cartDto, createProductResult.value);
  });
}
