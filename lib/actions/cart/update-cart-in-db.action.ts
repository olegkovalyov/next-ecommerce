'use server';

import { Cart, CartItem } from '@/lib/contracts/cart';
import { failure, Result, success } from '@/lib/result';
import { prisma } from '@/db/prisma';
import { Prisma } from '@prisma/client';
import { calcPrice } from '@/lib/actions/common/calc-price.action';
import { formatError } from '@/lib/utils';

export const updateCartInDb = async (cart: Cart): Promise<Result<boolean>> => {
  try {
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calcPrice(cart.items as CartItem[]),
      },
    });
    return success(true);
  } catch (error: unknown) {
    return failure(new Error(formatError(error)));
  }
};
