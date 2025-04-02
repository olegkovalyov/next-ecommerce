'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/db/prisma';
import { loadCart } from '@/lib/actions/cart/load-cart.action';
import { Cart, CartItem } from '@/lib/contracts/cart';
import { revalidatePath } from 'next/cache';
import { failure, Result, success } from '@/lib/result';
import { updateCartInDb } from '@/lib/actions/cart/update-cart-in-db.action';
import { Product } from '@/lib/contracts/product';

export const removeCartItem = async (productId: string): Promise<Result<string>> => {
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) {
    return failure(new Error('Cart session not found'));
  }

  const product = await prisma.product.findFirst({
    where: { id: productId },
  });
  if (!product) {
    return failure(new Error('Product not found'));
  }

  const loadCartResult = await loadCart();
  if (!loadCartResult.success) {
    return failure(new Error('Cart not found'));
  }

  const cart = loadCartResult.value;

  const processCartItemsResult = processCartItems(
    product,
    cart,
  );

  if (!processCartItemsResult.success) {
    return failure(new Error(processCartItemsResult.error.message));
  }

  const updateCartResult = await updateCartInDb(cart);
  if (!updateCartResult.success) {
    return failure(new Error(updateCartResult.error.message));
  }
  revalidatePath(`/product/${product.slug}`);

  const successMessage = `${product.name} was removed from cart`;
  return success(successMessage);
};

const processCartItems = (
  product: Product,
  cart: Cart,
): Result<Cart> => {
  const existingItem = findExistingItem(cart, product.id);
  if(!existingItem) {
    return failure(new Error('Item doesnt exist'));
  }

  if (existingItem.qty === 1) {
    // Remove from cart
    cart.items = (cart.items as CartItem[]).filter(
      (x) => x.productId !== existingItem.productId,
    );
  } else {
    // Decrease qty
    (cart.items as CartItem[]).find((x) => x.productId === product.id)!.qty =
      existingItem.qty - 1;
  }
  return success(cart);
};

const findExistingItem = (cart: Cart, productId: string): CartItem | undefined => {
  const existingItem = (cart.items as CartItem[]).find(
    (x) => x.productId === productId,
  );
  return existingItem;
};
