import { auth } from '@/infrastructure/auth/auth';
import { CartFactory } from '@/application/services/cart/concrete/cart.factory';
import { ReactElement } from 'react';
import { CartSummary } from '@/presentation/components/shared/cart/cart-summary';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';

const CartPage = async (): Promise<ReactElement> => {
  try {
    const session = await auth();
    const strategy = await CartFactory.createCartStrategy();
    const cartResult = await strategy.getCart();

    // If there's an error getting the cart, show empty cart state
    if (!cartResult.success) {
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

    const cartDto = cartResult.value.toDto();
    // If cart is empty or doesn't exist, show empty cart state
    if (cartDto.cartItemDtos.length === 0) {
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

    // Calculate cart totals
    const itemsPrice = 0;
    const taxPrice = 0;
    const totalPrice = 0;



    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/*<div className="lg:col-span-2">*/}
          {/*  <CartItems items={transformedItems} inStockQuantity={inStockQuantity} />*/}
          {/*</div>*/}
          <div className="lg:col-span-1">
            <CartSummary
              itemsPrice={itemsPrice}
              shippingPrice={cartDto.shippingPrice}
              taxPrice={taxPrice}
              totalPrice={totalPrice}
              isGuest={!session?.user?.id}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading cart:', error);
    // Show empty cart state instead of notFound
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
};

export default CartPage;
