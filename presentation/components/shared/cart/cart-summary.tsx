'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearCart } from '@/lib/actions/cart/clear-cart.action';
import { Button } from '@/presentation/components/ui/button';
import { Loader } from 'lucide-react';
import { ReactElement } from 'react';
import { CartDto } from '@/domain/dtos';
import { CartEntity } from '@/domain/entities/cart.entity';
import { useCartStore } from '@/store/cart.store';

interface CartSummaryProps {
  cartDto: CartDto;
  isGuest: boolean;
}

export function CartSummary(
  {
    cartDto,
    isGuest,
  }: CartSummaryProps): ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [itemsPrice, setItemsPrice] = useState(0);
  const [taxPrice, setTaxPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const { setCartDto } = useCartStore();

  useEffect(() => {
    const createCartResult = CartEntity.fromDto(cartDto);
    if (!createCartResult.success) {
      return;
    }
    const cart = createCartResult.value;
    // Calculate cart totals
    setItemsPrice(cart.calculateItemsPrice());
    setTaxPrice(cart.calculateTaxPrice());
    setTotalPrice(cart.calculateTotalPrice());
  }, [cartDto]);

  const handleClearCart = async () => {
    setLoading(true);
    try {
      const result = await clearCart(cartDto);
      if (!result.success) {
        return;
      }
      const updatedCartDto = result.value;
      setCartDto(updatedCartDto);
      router.refresh();
    } catch (error) {
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
      <h2 className="text-lg font-medium text-gray-900">Order summary</h2>

      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-600">Subtotal</dt>
          <dd className="text-sm font-medium text-gray-900">${itemsPrice.toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <dt className="text-sm text-gray-600">Shipping</dt>
          <dd className="text-sm font-medium text-gray-900">${cartDto.shippingPrice.toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <dt className="text-sm text-gray-600">Tax</dt>
          <dd className="text-sm font-medium text-gray-900">${taxPrice.toFixed(2)}</dd>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <dt className="text-base font-medium text-gray-900">Order total</dt>
          <dd className="text-base font-medium text-gray-900">${totalPrice.toFixed(2)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        {isGuest ? (
          <Button
            className="w-full"
            onClick={() => router.push('/sign-in')}
          >
            Sign in to checkout
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => router.push('/checkout')}
          >
            Proceed to checkout
          </Button>
        )}
      </div>

      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearCart}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Clearing cart...
            </>
          ) : (
            'Clear cart'
          )}
        </Button>
      </div>
    </div>
  );
}
