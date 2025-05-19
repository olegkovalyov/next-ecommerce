import { auth } from '@/infrastructure/auth/auth';
import { CartDto } from '@/domain/dtos';
import { failure, Result, success } from '@/lib/result';
import { Container } from '@/lib/di';

import { handleCartAction } from '../utils/handle-cart-action';

export async function sync(): Promise<Result<CartDto>> {
  const user = (await auth())?.user;
  if (!user) {
    return failure(new Error('Not authorised'));
  }
  return handleCartAction(() => Container.getInstance().getCartService().loadByUserId(user.id));
}

