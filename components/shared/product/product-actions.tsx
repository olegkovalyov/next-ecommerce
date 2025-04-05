import { Card, CardContent } from '@/components/ui/card';
import ProductPrice from '@/components/shared/product/product-price';
import { Badge } from '@/components/ui/badge';
import AddToCart from '@/components/shared/product/add-to-cart';
import { Cart } from '@/lib/contracts/cart';
import { ReactElement } from 'react';

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    stock: number;
  };
  cart: Cart | null;
}

const ProductActions = ({ product, cart }: ProductActionsProps): ReactElement => {
  return (
    <div>
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex justify-between">
            <div>Price</div>
            <div>
              <ProductPrice value={product.price} />
            </div>
          </div>
          <div className="mb-2 flex justify-between">
            <div>Status</div>
            {product.stock > 0 ? (
              <Badge variant="outline">In Stock</Badge>
            ) : (
              <Badge variant="destructive">Out Of Stock</Badge>
            )}
          </div>
          {product.stock > 0 && (
            <div className="flex-center">
              <AddToCart
                product={product}
                cart={cart}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductActions;
