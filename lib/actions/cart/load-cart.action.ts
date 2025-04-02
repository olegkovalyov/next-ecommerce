'use server';

import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { convertToPlainObject } from '@/lib/utils';
import { Cart, CartItem } from '@/lib/contracts/cart';
import { failure, Result, success } from '@/lib/result';

export const loadCart = async (): Promise<Result<Cart>> => {
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) {
    return failure(new Error('Cart session not found'));
  }

  const session = await auth();
  const userId = session ? session.user.id : null;

  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) {
    return failure(new Error('Cart not found'));
  }

  return success(convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  }));
};
