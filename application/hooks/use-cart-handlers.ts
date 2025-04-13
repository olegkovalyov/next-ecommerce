// hooks/useCartActions.ts
'use client';

import { useTransition } from 'react';
import { CartDto, ProductDto } from '@/domain/dtos';
import { addToCart } from '@/lib/actions/cart/add-to-cart.action';
import { removeFromCart } from '@/lib/actions/cart/remove-from-cart.action';
import { useCartStore } from '@/store/cart.store';
import { toast } from 'sonner';
import { clearCart } from '@/lib/actions/cart';

type CartItemAction = 'add' | 'remove';
type CartAction = 'clear-cart' | 'remove-products';


interface UseCartActionsProps {
  cartDto: CartDto;
}

interface UseCartActionsReturn {
  isPending: boolean;
  handleCartAction: (action: CartAction, productDto: ProductDto) => Promise<void>;
  handleCartItemAction: (action: CartItemAction, productDto: ProductDto) => Promise<void>;
  getExistingItem: (productId: string) => { productId: string; quantity: number } | undefined;
}

export function useCartActions({ cartDto }: UseCartActionsProps): UseCartActionsReturn {
  const [isPending, startTransition] = useTransition();
  const { setCart } = useCartStore();

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
          toast.error(result.error.message);
          return;
        }

        // Update Zustand store with the new cart state
        setCart(result.value);

        const successMessage = action === 'add'
          ? 'Product added to cart'
          : 'Product removed from cart';

        toast.success(successMessage);
      } catch (error) {
        console.error('Error handling cart action:', error);
        toast.error('Failed to update cart');
      }
    });
  };



  const handleCartAction = async (action: CartAction, productDto: ProductDto): Promise<void> => {
    startTransition(async () => {
      try {
        const actionMap = {
          ['clear-cart']: () => clearCart(cartDto),
          ['remove-products']: () => clearCart(cartDto),
        };

        const result = await actionMap[action]();

        if (!result.success) {
          toast.error(result.error.message);
          return;
        }

        // Update Zustand store with the new cart state
        setCart(result.value);

        const successMessage = action === 'clear-cart'
          ? 'Cart was cleared'
          : `All ${productDto.name}  removed from cart`;

        toast.success(successMessage);
      } catch (error) {
        console.error('Error handling cart action:', error);
        toast.error('Failed to update cart');
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
