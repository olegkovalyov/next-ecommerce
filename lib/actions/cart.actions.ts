'use server';

import { cookies } from 'next/headers';
import { convertToPlainObject, formatError, roundNumber } from '../utils';
import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { cartItemSchema, insertCartSchema } from '@/lib/validators/cart.validator';
import { CartItem } from '@/lib/contracts/cart';

// Calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = roundNumber(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
    ),
    shippingPrice = roundNumber(itemsPrice > 100 ? 0 : 10),
    taxPrice = roundNumber(0.15 * itemsPrice),
    totalPrice = roundNumber(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
// Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) {
      return {
        success: false,
        message: 'Cart session not found',
      };
    }

// Get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

// Get cart
    const cart = await getMyCart();

// Parse and validate item
    const item: CartItem = cartItemSchema.parse(data);

// Find product in database
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });
    if (!product) {
      return {
        success: false,
        message: 'Product not found',
      };
    }

    if (!cart) {
      await createNewCart(
        item,
        sessionCartId,
        userId,
      );
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: `${product.name} added to cart`,
      };
    }

    // Check if item is already in cart
    const existItem = (cart.items as CartItem[]).find(
      (x) => x.productId === item.productId,
    );

    if (existItem) {
      // Check stock
      if (product.stock < existItem.qty + 1) {
        return {
          success: false,
          message: 'Not enough stock',
        };
      }

      // Increase the quantity
      (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId,
      )!.qty = existItem.qty + 1;
    } else {
      // If item does not exist in cart
      // Check stock
      if (product.stock < 1) {
        return {
          success: false,
          message: 'Not enough stock',
        };
      }

      // Add item to the cart.items
      cart.items.push(item);
    }

    // Save to database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calcPrice(cart.items as CartItem[]),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} ${
        existItem ? 'updated in' : 'added to'
      } cart`,
    };

  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export const getMyCart = async () => {
// Check for cart cookie
  const sessionCartId = (await cookies()).get('sessionCartId')?.value;
  if (!sessionCartId) throw new Error('Cart session not found');

// Get session and user ID
  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

// Get user cart from database
  const cart = await prisma.cart.findFirst({
    where: userId ? { userId: userId } : { sessionCartId: sessionCartId },
  });

  if (!cart) return undefined;

// Convert decimals and return
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
};

const createNewCart = async (
  item: CartItem,
  sessionCartId: string,
  userId: string | undefined,
): Promise<void> => {

  const newCart = insertCartSchema.parse({
    userId: userId,
    items: [item],
    sessionCartId: sessionCartId,
    ...calcPrice([item]),
  });

  await prisma.cart.create({
    data: newCart,
  });
};


export async function removeItemFromCart(productId: string) {
  try {
    // Check for cart cookie
    const sessionCartId = (await cookies()).get('sessionCartId')?.value;
    if (!sessionCartId) {
      return {
        success: false,
        message: 'Cart session not found'
      };
    }

    // Get Product
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });
    if (!product) {
      return {
        success: false,
        message: 'Product not found'
      };
    }

    // Get user cart
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: 'Cart not found'
      };
    }

    // Check for item
    const exist = (cart.items as CartItem[]).find(
      (x) => x.productId === productId
    );
    if (!exist) {
      return {
        success: false,
        message: 'Item not found'
      };
    }

    // Check if only one in qty
    if (exist.qty === 1) {
      // Remove from cart
      cart.items = (cart.items as CartItem[]).filter(
        (x) => x.productId !== exist.productId
      );
    } else {
      // Decrease qty
      (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty =
        exist.qty - 1;
    }

    // Update cart in database
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: cart.items as Prisma.CartUpdateitemsInput[],
        ...calcPrice(cart.items as CartItem[]),
      },
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} was removed from cart`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error)
    };
  }
}
