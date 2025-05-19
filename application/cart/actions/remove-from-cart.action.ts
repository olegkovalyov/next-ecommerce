'use server';

import { Result } from '@/lib/result';
import { CartDto } from '@/domain/dtos';
import { Container } from '@/lib/di';

import { handleCartAction } from '../utils/handle-cart-action';

export async function removeFromCart(
  cartDto: CartDto,
  productId: string,
  quantity: number = 1,
): Promise<Result<CartDto>> {
  return handleCartAction(() => Container.getInstance().getCartService().removeItem(cartDto, productId, quantity));
}
