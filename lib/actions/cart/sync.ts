import { auth } from '@/infrastructure/auth/auth';
import { CartDto } from '@/domain/dtos';
import { failure, Result, success } from '@/lib/result';
import { CartService } from '@/application/services/cart/cart.service';

export async function sync(): Promise<Result<CartDto>> {
  const user = (await auth())?.user;
  if (!user) {
    return failure(new Error('Not authorised'));
  }

  const cartResult = await CartService.loadByUserId(user.id);
  if (!cartResult.success) {
    return failure(new Error('No cart'));
  }
  return success(cartResult.value.toDto());
}
