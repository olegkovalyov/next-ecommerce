'use client';

import CheckoutSteps from '@/presentation/components/shared/checkout/checkout-steps';
import { ReactElement, useEffect, useState } from 'react';
import StripeProvider from '@/presentation/components/shared/checkout/stripe-provider';
import StripeCheckoutForm from '@/presentation/components/shared/checkout/stripe-checkout-form';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { Button } from '@/presentation/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';


const CheckoutPage = (): ReactElement => {
  const { getCartDto } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    // if (!isAuthenticated()) {
    //   toast.error('You need to sign in to complete your order');
    //   router.push('/sign-in?callbackUrl=/checkout');
    //   return;
    // }

    // Check if there are items in the cart
    const cartDto = getCartDto();
    if (!cartDto.cartItemDtos.length) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }

    // Get cart ID from storage or create a new cart
    const fetchCartId = async () => {
      try {
        // Here you can add logic to get the cart ID from the server
        // For demonstration purposes, we're using a temporary ID
        setCartId('temp-cart-id');
      } catch (error) {
        console.error('Error fetching cart ID:', error);
        toast.error('Error loading cart data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartId();
  }, [isAuthenticated, getCartDto, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutSteps current={2} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!cartId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CheckoutSteps current={2} />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">Loading Error</h2>
          <p className="text-muted-foreground mb-6">
            Unable to load cart data. Please try again.
          </p>
          <Button asChild>
            <Link href="/cart">Return to Cart</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CheckoutSteps current={2} />
      <div className="max-w-3xl mx-auto mt-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Order</h1>
        <StripeProvider>
          <StripeCheckoutForm cartId={cartId} />
        </StripeProvider>
      </div>
    </div>
  );
};

export default CheckoutPage;
