'use client';

import { Card, CardContent } from '@/presentation/components/ui/card';
import ProductPrice from '@/presentation/components/shared/product/product-price';
import { Badge } from '@/presentation/components/ui/badge';
import { CartActions } from '@/presentation/components/shared/product/cart-actions';
import { ProductDto } from '@/domain/dtos';
import { useCartStore } from '@/store/cart.store';
import { ReactElement, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useCartSync } from '@/application/hooks/use-cart-sync';

interface ProductActionsProps {
  productDto: ProductDto;
}

const ProductActions = ({ productDto }: ProductActionsProps): ReactElement => {

  const { isAuthenticated } = useAuthStore();
  const { debouncedSyncCart } = useCartSync();
  const { getCartDto } = useCartStore();

  const cartDto = getCartDto();

  useEffect(() => {
    if (isAuthenticated()) {
      debouncedSyncCart(cartDto);
    }
  }, [cartDto, debouncedSyncCart, isAuthenticated]);

  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex justify-between">
            <div>Price</div>
            <div>
              <ProductPrice value={productDto.price} />
            </div>
          </div>
          <div className="mb-2 flex justify-between">
            <div>Status</div>
            {productDto.stock > 0 ? (
              <Badge variant="outline">In Stock</Badge>
            ) : (
              <Badge variant="destructive">Out Of Stock</Badge>
            )}
          </div>
          {productDto.stock > 0 && (
            <div className="flex-center">
              <CartActions productDto={productDto} cartDto={cartDto} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductActions;
