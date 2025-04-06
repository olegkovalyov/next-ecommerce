'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/presentation/components/ui/button';
import { Plus, Minus, Loader } from 'lucide-react';
import { ProductDto } from '@/domain/entities/product.entity';
import { CartDto } from '@/domain/entities/cart.entity';
import { addToCart } from '@/lib/actions/cart/add-to-cart.action';
import { removeFromCart } from '@/lib/actions/cart/remove-from-cart.action';

type CartAction = 'add' | 'remove';

interface AddToCartProps {
  productDto: ProductDto;
  cartDto: CartDto;
}

export function AddToCart({ productDto, cartDto }: AddToCartProps) {
  const [isPending, startTransition] = useTransition();

  const existingItem = cartDto?.items.find((item: { productId: string }) => item.productId === productDto.id);

  const handleCartAction = async (action: CartAction) => {
    startTransition(async () => {
      try {
        const actionMap = {
          add: () => addToCart(productDto, 1),
          remove: () => removeFromCart(productDto.id, 1),
        };

        const result = await actionMap[action]();

        if (!result.success) {
          toast.error(result.error.message);
          return;
        }

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

  if (!existingItem) {
    return (
      <Button
        onClick={() => handleCartAction('add')}
        disabled={isPending || productDto.stock <= 0}
        className="w-full"
      >
        {isPending ? (
          <div className="flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span>Adding...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add to Cart</span>
          </div>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleCartAction('remove')}
        disabled={isPending || existingItem.quantity === 0}
      >
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Minus className="w-4 h-4" />
        )}
      </Button>
      <span className="px-2">{existingItem.quantity}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleCartAction('add')}
        disabled={isPending || existingItem.quantity >= productDto.stock}
      >
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
