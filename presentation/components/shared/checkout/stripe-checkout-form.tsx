'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button } from '@/presentation/components/ui/button';
import { useCartStore } from '@/store/cart.store';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CartEntity } from '@/domain/entities/cart.entity';
import { LockIcon, CreditCardIcon } from 'lucide-react';

interface StripeCheckoutFormProps {
  cartId: string;
}

const StripeCheckoutForm = ({ cartId }: StripeCheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { getCartDto, clearCart } = useCartStore();
  const router = useRouter();
  
  const cartDto = getCartDto();
  const createCartResult = CartEntity.fromDto(cartDto);
  
  // If we couldn't create the cart, show an error
  if (!createCartResult.success) {
    return (
      <div className="text-red-500">
        Error loading cart data
      </div>
    );
  }
  
  const cart = createCartResult.value;
  const totalAmount = cart.calculateTotalPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      // Create payment session on the server
      const response = await fetch('/api/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId,
          totalAmount,
        }),
      });

      const { sessionId, url, error } = await response.json();

      if (error) {
        toast.error('Error creating payment');
        setIsLoading(false);
        return;
      }

      // If we have a URL for Stripe Checkout, redirect the user
      if (url) {
        window.location.href = url;
        return;
      }

      // If there's no URL, use Elements to confirm payment
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        toast.error('Error processing payment');
        setIsLoading(false);
        return;
      }

      const { error: stripeError } = await stripe.confirmCardPayment(sessionId, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        toast.error(stripeError.message || 'Error processing payment');
      } else {
        toast.success('Payment successful!');
        clearCart();
        router.push('/order/success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred while processing your payment');
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <CreditCardIcon className="mr-2 h-5 w-5 text-primary" />
            Payment Details
          </h3>
          <div className="text-sm text-gray-500 flex items-center">
            <LockIcon className="h-4 w-4 mr-1" /> Secure Payment
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-gray-50 border border-gray-200">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      fontFamily: 'Arial, sans-serif',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                      iconColor: '#6772e5',
                    },
                    invalid: {
                      color: '#9e2146',
                      iconColor: '#9e2146',
                    },
                  },
                  hidePostalCode: true,
                }}
                className="py-2"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
              </div>
              <Button 
                type="submit" 
                disabled={!stripe || isLoading}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-md flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              By clicking "Pay Now", you agree to our terms and conditions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StripeCheckoutForm;
