'use client';

import { Button } from '@/presentation/components/ui/button';
import { Plus, Minus, Loader } from 'lucide-react';
import { CartDto, ProductDto } from '@/domain/dtos';
import { useCartActions } from '@/application/hooks/use-cart-handlers';

interface AddToCartProps {
  productDto: ProductDto;
  cartDto: CartDto;
}

export function CartActions({ productDto, cartDto }: AddToCartProps) {

  const { isPending, handleCartItemAction, getExistingItem } = useCartActions({
    cartDto,
  });

  const existingItem = getExistingItem(productDto.id);

  if (!existingItem) {
    return (
      <Button
        onClick={() => handleCartItemAction('add', productDto)}
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
        onClick={() => handleCartItemAction('remove', productDto)}
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
        onClick={() => handleCartItemAction('add', productDto)}
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
