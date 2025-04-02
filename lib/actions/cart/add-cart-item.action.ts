'use server';

import { Cart, CartItem } from '@/lib/contracts/cart';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { loadCart } from '@/lib/actions/cart/load-cart.action';
import { cartItemSchema } from '@/lib/validators/cart.validator';
import { prisma } from '@/db/prisma';
import { createNewCart } from '@/lib/actions/cart/create-cart.action';
import { revalidatePath } from 'next/cache';
import { Result, success, failure } from '@/lib/result';
import { Product } from '@/lib/contracts/product';
import { updateCartInDb } from '@/lib/actions/cart/update-cart-in-db.action';

export async function addCartItem(cartItem: CartItem): Promise<Result<string, Error>> {
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) {
    return failure(new Error('Cart session not found'));
  }

  const session = await auth();
  const item: CartItem = cartItemSchema.parse(cartItem);

  const product = await prisma.product.findFirst({
    where: { id: item.productId },
  });
  if (!product) {
    return failure(new Error('Product not found'));
  }

  const userId = session?.user?.id ? (session.user.id as string) : undefined;
  const loadCartResult = await loadCart();
  if (!loadCartResult.success) {
    const resultCreateNewCart = await createNewCart(
      item,
      sessionCartId,
      userId,
    );

    if (!resultCreateNewCart.success) {
      return failure(new Error(resultCreateNewCart.error.message));
    }
    revalidatePath(`/product/${product.slug}`);
    const successMessage = `${product.name} added to cart`;
    return success(successMessage);
  }

  const cart = loadCartResult.value;

  const processCartItemsResult = processCartItems(
    product,
    cart,
    item,
  );

  if (!processCartItemsResult.success) {
    return failure(new Error(processCartItemsResult.error.message));
  }

  const updateCartResult = await updateCartInDb(cart);
  if (!updateCartResult.success) {
    return failure(new Error(updateCartResult.error.message));
  }
  revalidatePath(`/product/${product.slug}`);
  const existingItem = findExistingItem(cart, cartItem);
  const successMessage = `${product.name} ${existingItem ? 'updated in' : 'added to'} cart`;
  return success(successMessage);
}

const processCartItems = (
  product: Product,
  cart: Cart,
  cartItem: CartItem,
): Result<Cart> => {
  const existingItem = findExistingItem(cart, cartItem);

  if (existingItem) {
    if (product.stock < existingItem.qty + 1) {
      return failure(new Error('Not enough stock'));
    }
    (cart.items as CartItem[]).find(
      (x) => x.productId === cartItem.productId,
    )!.qty = existingItem.qty + 1;
  } else {
    if (product.stock < 1) {
      return failure(new Error('Not enough stock'));
    }
    cart.items.push(cartItem);
  }
  return success(cart);
};

const findExistingItem = (cart: Cart, cartItem: CartItem): CartItem | undefined => {
  const existingItem = (cart.items as CartItem[]).find(
    (x) => x.productId === cartItem.productId,
  );
  return existingItem;
};
