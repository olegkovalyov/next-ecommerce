import { auth } from '@/infrastructure/auth/auth';
import { CartRepository } from '@/infrastructure/repositories/cart.repository';
import { prisma } from '@/infrastructure/prisma/prisma';
import { CartDto } from '@/domain/dtos';
import { failure, Result, success } from '@/lib/result';

export async function sync(): Promise<Result<CartDto>> {
  const user = (await auth())?.user;
  if (!user) {
    return failure(new Error('Not authorised'));
  }

  const cartRepository = new CartRepository(prisma);
  const cartResult = await cartRepository.findByUserId(user.id);
  if (!cartResult.success) {
    return failure(new Error('No cart'));
  }
  return success(cartResult.value.toDto());

}
