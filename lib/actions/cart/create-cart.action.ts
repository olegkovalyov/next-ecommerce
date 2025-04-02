'use server';

import { Cart, CartItem } from '@/lib/contracts/cart';
import { insertCartSchema } from '@/lib/validators/cart.validator';
import { prisma } from '@/db/prisma';
import { calcPrice } from '@/lib/actions/common/calc-price.action';
import { convertToPlainObject } from '@/lib/utils';
import { failure, Result, success } from '@/lib/result';

export const createNewCart = async (
  item: CartItem,
  sessionCartId: string,
  userId: string | undefined,
): Promise<Result<Cart>> => {

  const newCart = insertCartSchema.parse({
    userId: userId,
    items: [item],
    sessionCartId: sessionCartId,
    ...calcPrice([item]),
  });

  try {
    const cart = await prisma.cart.create({
      data: newCart,
    });
    return success(convertToPlainObject({
      ...cart,
      items: cart.items as CartItem[],
      itemsPrice: cart.itemsPrice.toString(),
      totalPrice: cart.totalPrice.toString(),
      shippingPrice: cart.shippingPrice.toString(),
      taxPrice: cart.taxPrice.toString(),
    }));
  } catch (error: unknown) {
    return failure(new Error('Failed to create new cart'));
  }
};
