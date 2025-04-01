import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';
import { Cart, CartItem } from '@/lib/contracts/cart';
import { Err, Ok, Result } from 'ts-results';

export const loadCart = async (): Promise<Result<Cart, Error>> => {
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) {
    return Err(new Error('Cart session not found'));
  }

  const session = await auth();
  if (!session) {
    return Err(new Error('Session has expired'));
  }

  const userId = session.user.id;
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) {
    return Err(new Error('Cart not found'));
  }

  return Ok(convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  }));
};
