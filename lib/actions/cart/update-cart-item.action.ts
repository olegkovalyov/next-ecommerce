'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Result, success, failure } from '@/lib/result';
import { CartService } from '@/infrastructure/services/cart.service';
import { CartRepository } from '@/infrastructure/persistence/cart.repository';
import { ServerGuestCartService } from '@/infrastructure/services/server-guest-cart.service';
import { prisma } from '@/db/prisma';
import { ProductEntity } from '@/domain/product.entity';

export async function updateCartItem(
  productId: string,
  quantity: number,
): Promise<Result<string>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Handle guest cart
      const cart = await ServerGuestCartService.getCartItems();
      const item = cart.find((item) => item.productId === productId);

      if (!item) {
        return failure(new Error('Item not found in cart'));
      }

      if (quantity <= 0) {
        await ServerGuestCartService.removeItem(productId);
      } else {
        // Get product data from database
        const product = await prisma.product.findUnique({
          where: { id: productId },
        });

        if (!product) {
          return failure(new Error('Product not found'));
        }

        // Create ProductEntity instance
        const productEntity = new ProductEntity({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          images: product.images,
          stock: product.stock,
          description: product.description,
          category: product.category,
          brand: product.brand,
          rating: product.rating,
          numReviews: product.numReviews,
          isFeatured: product.isFeatured,
          banner: product.banner,
          createdAt: product.createdAt,
        });

        await ServerGuestCartService.addItem(productEntity, quantity - item.qty);
      }

      revalidatePath('/cart');
      return success('Cart updated');
    }

    // Handle authenticated user cart
    const cartResult = await CartService.loadOrCreateCart();
    if (!cartResult.success) {
      return failure(cartResult.error);
    }

    const cart = cartResult.value;
    if (!cart) {
      return failure(new Error('Cart not found'));
    }

    // Get product data from database
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return failure(new Error('Product not found'));
    }

    // Create ProductEntity instance
    const productEntity = new ProductEntity({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      images: product.images,
      stock: product.stock,
      description: product.description,
      category: product.category,
      brand: product.brand,
      rating: product.rating,
      numReviews: product.numReviews,
      isFeatured: product.isFeatured,
      banner: product.banner,
      createdAt: product.createdAt,
    });

    if (quantity <= 0) {
      cart.removeProduct(productId);
    } else {
      const addResult = cart.addProduct(productEntity, quantity);
      if (!addResult.success) {
        return failure(addResult.error);
      }
    }

    const saveResult = await CartRepository.saveCart(cart);
    if (!saveResult.success) {
      return failure(saveResult.error);
    }

    revalidatePath('/cart');
    return success('Cart updated');
  } catch (error) {
    console.error('Error updating cart:', error);
    return failure(new Error('Failed to update cart'));
  }
}
