'use client';

import { ReactElement, useEffect } from 'react';
import { CartSummary } from '@/presentation/components/shared/cart/cart-summary';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartItems } from '@/presentation/components/shared/cart/cart-items';
import { useAuthStore } from '@/store/auth.store';
import { useCartSync } from '@/application/hooks/use-cart-sync';

const CartPage = (): ReactElement => {
  const { getCartDto } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { debouncedSyncCart } = useCartSync();
  const cartDto = getCartDto();

  useEffect(() => {
    if (isAuthenticated()) {
      debouncedSyncCart(cartDto);
    }
  }, [cartDto, debouncedSyncCart, isAuthenticated]);

  const createCartResult = CartEntity.fromDto(cartDto);

  // If there's an error getting the cart, show empty cart state
  if (
    !createCartResult.success
    || !cartDto.cartItemDtos.length
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Looks like you haven&#39;t added any items to your cart yet.
        </p>
        <Button asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CartItems cartDto={cartDto} />
        </div>
        <div className="lg:col-span-1">
          <CartSummary
            cartDto={cartDto}
            isGuest={true}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
