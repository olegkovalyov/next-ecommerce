import { Card, CardContent } from '@/presentation/components/ui/card';
import ProductPrice from '@/presentation/components/shared/product/product-price';
import { Badge } from '@/presentation/components/ui/badge';
import { AddToCart } from '@/presentation/components/shared/product/add-to-cart';
import { ReactElement } from 'react';
import { ProductDto } from '@/domain/entities/product.entity';
import { CartFactory } from '@/application/services/cart/cart.factory';
import { CartService } from '@/application/services/cart/cart.service';

interface ProductActionsProps {
  productDto: ProductDto;
}

const ProductActions = async ({ productDto }: ProductActionsProps): Promise<ReactElement> => {
  const strategy = await CartFactory.createCartStrategy();
  const cartResult = await strategy.getCart();
  const cart = cartResult.success ? cartResult.value : CartService.createCart();
  const cartDto = cart.getCartDto();

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
