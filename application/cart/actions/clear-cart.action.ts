'use server';

import { Result } from '@/lib/result';
import { CartDto } from '@/domain/dtos';
import { Container } from '@/lib/di';

import { handleCartAction } from '../utils/handle-cart-action';

export async function clearCart(cartDto: CartDto): Promise<Result<CartDto>> {
  return handleCartAction(() => Container.getInstance().getCartService().clearCart(cartDto));
}

