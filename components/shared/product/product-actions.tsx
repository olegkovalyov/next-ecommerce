import { Card, CardContent } from '@/components/ui/card';
import ProductPrice from '@/components/shared/product/product-price';
import { Badge } from '@/components/ui/badge';
import AddToCart from '@/components/shared/product/add-to-cart';
import { Product } from '@/lib/contracts/product';
import { Cart } from '@/lib/contracts/cart';

const ProductActions = (
  { product, cart }: { product: Product, cart?: Cart },
) => {
  return (<>
    <div>
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex justify-between">
            <div>Price</div>
            <div>
              <ProductPrice value={Number(product.price)} />
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
                cart={cart}
                item={{
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  qty: 1,
                  image: product.images![0],
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </>);
};

export default ProductActions;
