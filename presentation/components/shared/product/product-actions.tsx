'use client';

import { Card, CardContent } from '@/presentation/components/ui/card';
import ProductPrice from '@/presentation/components/shared/product/product-price';
import { Badge } from '@/presentation/components/ui/badge';
import { AddToCart } from '@/presentation/components/shared/product/add-to-cart';
import { CartDto, ProductDto } from '@/domain/dtos';
import { useCartStore } from '@/store/cart.store';
import { router } from 'next/client';

interface ProductActionsProps {
  productDto: ProductDto;
}

const ProductActions = ({ productDto }: ProductActionsProps) => {

  const { getCart } = useCartStore();

  const cartDto = getCart() as CartDto;

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
              <AddToCart productDto={productDto} cartDto={cartDto} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductActions;
