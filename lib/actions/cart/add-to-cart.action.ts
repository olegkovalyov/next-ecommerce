'use server';

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { Result, success, failure } from '@/lib/result';
import { ProductEntity } from '@/domain/product.entity';
import { CartService } from '@/application/services/cart/cart.service';
import { CartRepository } from '@/infrastructure/prisma/persistence/cart.repository';
import { ServerGuestCartService } from '@/application/services/cart/server-guest-cart.service';

type ProductData = {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
};

export async function addToCart(
  productData: ProductData,
  quantity: number = 1,
): Promise<Result<string>> {
  try {
    const session = await auth();

    // Create ProductEntity instance on the server side
    const product = new ProductEntity({
      id: productData.id,
      name: productData.name,
      slug: productData.slug,
      price: productData.price,
      images: productData.images,
      stock: productData.stock,
      description: '', // Required by ProductEntity but not used in cart
      category: '', // Required by ProductEntity but not used in cart
      brand: '', // Required by ProductEntity but not used in cart
      rating: 0, // Required by ProductEntity but not used in cart
      numReviews: 0, // Required by ProductEntity but not used in cart
      isFeatured: false, // Required by ProductEntity but not used in cart
      banner: null, // Required by ProductEntity but not used in cart
      createdAt: new Date(), // Required by ProductEntity but not used in cart
    });

    if (!session?.user?.id) {
      // Handle guest cart
      await ServerGuestCartService.addItem(product, quantity);

      revalidatePath(`/product/${product.slug}`);
      revalidatePath('/cart');
      return success(`${product.name} added to cart`);
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

    const addResult = cart.addProduct(product, quantity);
    if (!addResult.success) {
      return failure(addResult.error);
    }

    cart.setTaxPercentage(10);
    const saveResult = await CartRepository.saveCart(cart);
    if (!saveResult.success) {
      return failure(saveResult.error);
    }

    revalidatePath(`/product/${product.slug}`);
    revalidatePath('/cart');

    return success(`${product.name} added to cart`);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return failure(new Error('Failed to add item to cart'));
  }
}
