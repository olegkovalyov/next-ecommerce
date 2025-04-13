// hooks/useCartActions.ts
'use client';

import { useTransition } from 'react';
import { CartDto, ProductDto } from '@/domain/dtos';
import { addToCart } from '@/lib/actions/cart/add-to-cart.action';
import { removeFromCart } from '@/lib/actions/cart/remove-from-cart.action';
import { useCartStore } from '@/store/cart.store';
import { clearCart } from '@/lib/actions/cart';
import { useToast } from '@/application/hooks/use-sonner-toast';

type CartItemAction = 'add' | 'remove';
type CartAction = 'clear-cart' | 'remove-products';

interface UseCartActionsProps {
  cartDto: CartDto;
}

interface UseCartActionsReturn {
  isPending: boolean;
  handleCartAction: (action: CartAction, productDto: ProductDto, quantity?: number) => Promise<void>;
  handleCartItemAction: (action: CartItemAction, productDto: ProductDto) => Promise<void>;
  getExistingItem: (productId: string) => { productId: string; quantity: number } | undefined;
}

export function useCartActions({ cartDto }: UseCartActionsProps): UseCartActionsReturn {
  const [isPending, startTransition] = useTransition();
  const { setCart } = useCartStore();
  const { success: showSuccess, error: showError } = useToast();

  const getExistingItem = (productId: string) => {
    return cartDto.cartItemDtos.find((item) => item.productId === productId);
  };

  const handleCartItemAction = async (action: CartItemAction, productDto: ProductDto): Promise<void> => {
    startTransition(async () => {
      try {
        const actionMap = {
          ['add']: () => addToCart(cartDto, productDto),
          ['remove']: () => removeFromCart(cartDto, productDto.id),
        };

        const result = await actionMap[action]();

        if (!result.success) {
          // toast.error(result.error.message);
          return;
        }

        // Update Zustand store with the new cart state
        setCart(result.value);

        const successMessage = action === 'add'
          ? `${productDto.name} added to card`
          : `${productDto.name} removed from card`;

        showSuccess(successMessage);

      } catch (error) {
        showError('Error handling cart item action');
        console.error('Error handling cart item action:', error);
      }
    });
  };

  const handleCartAction = async (action: CartAction, productDto: ProductDto, quantity: number = 1): Promise<void> => {
    startTransition(async () => {
      try {
        const actionMap = {
          ['clear-cart']: () => clearCart(cartDto),
          ['remove-products']: () => removeFromCart(cartDto, productDto.id, quantity),
        };

        const result = await actionMap[action]();

        if (!result.success) {
          return;
        }

        // Update Zustand store with the new cart state
        setCart(result.value);

        const successMessage = action === 'clear-cart'
          ? 'Cart was cleared'
          : `All ${productDto.name} products were removed from cart`;
        showSuccess(successMessage);

      } catch (error) {
        showError('Error handling cart action');
        console.error('Error handling cart action:', error);
      }
    });
  };

  return {
    isPending,
    handleCartAction,
    handleCartItemAction,
    getExistingItem,
  };
}
