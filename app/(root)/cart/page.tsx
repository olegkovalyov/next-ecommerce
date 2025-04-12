'use client';

import { ReactElement } from 'react';
import { CartSummary } from '@/presentation/components/shared/cart/cart-summary';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { CartDto } from '@/domain/dtos';
import { CartEntity } from '@/domain/entities/cart.entity';
import { CartItems } from '@/presentation/components/shared/cart/cart-items';

const CartPage = (): ReactElement => {
  const { getCart } = useCartStore();
  const cartDto = getCart() as CartDto;
  console.log('CartDto: ', cartDto);

  const createCartResult = CartEntity.fromDto(cartDto);

  // If there's an error getting the cart, show empty cart state
  if (
    !cartDto.cartItemDtos.length
    || !createCartResult.success
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
  const cart = createCartResult.value;
  // Calculate cart totals
  const itemsPrice = cart.calculateItemsPrice()
  const taxPrice = cart.calculateTaxPrice();
  const totalPrice = cart.calculateTotalPrice();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CartItems cartDto={cartDto} />
        </div>
        <div className="lg:col-span-1">
          <CartSummary
            itemsPrice={itemsPrice}
            shippingPrice={cartDto.shippingPrice}
            taxPrice={taxPrice}
            totalPrice={totalPrice}
            isGuest={true}
          />
        </div>
      </div>
    </div>
  );
};

export default CartPage;
