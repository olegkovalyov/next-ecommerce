'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ReactElement } from 'react';
import { useCartStore } from '@/store/cart.store';

const CartButton = (): ReactElement => {
  const router = useRouter();
  const { getCartDto } = useCartStore();
  const cart = getCartDto();
  let itemsCount = 0;
  cart.cartItemDtos.forEach(item => {
    itemsCount += item.quantity;
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative mr-2"
      onClick={() => router.push('/cart')}
    >
      <span className="hidden md:inline">Cart</span>
      <div className="relative">
        <ShoppingCart className="h-16 w-16 " />
        {itemsCount > 0 && (
          <Badge
            variant="default"
            className="absolute -top-3 -right-3 h-4 w-4 flex items-center justify-center p-0 bg-primary text-primary-foreground"
          >
            {itemsCount}
          </Badge>
        )}
      </div>
    </Button>
  );
};

export default CartButton;
