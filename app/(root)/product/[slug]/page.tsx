import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductImages from '@/components/shared/product/product-images';
import ProductDetails from '@/components/shared/product/product-details';
import ProductActions from '@/components/shared/product/product-actions';
import { CartLoader } from '@/infrastructure/services/cart.loader';
import { convertToPlainObject } from '@/lib/utils';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const cartResult = await CartLoader.loadOrCreateCart();
  const cart = cartResult.success ? cartResult.value : null;

  // Convert product to plain object and serialize for client components
  const plainProduct = convertToPlainObject(product);
  const serializedProduct = {
    id: plainProduct.id,
    name: plainProduct.name,
    slug: plainProduct.slug,
    price: Number(plainProduct.price),
    images: plainProduct.images,
    stock: plainProduct.stock,
  };

  // Convert cart data to match expected Cart type
  const cartData = cart?.getCartData();
  const serializedCart = cartData ? {
    id: cartData.id,
    items: cartData.items,
    itemsPrice: 0, // These will be calculated on the client
    totalPrice: 0,
    shippingPrice: cartData.shippingPrice,
    taxPrice: 0,
    sessionCartId: cartData.sessionCartId || '',
    userId: cartData.userId || undefined,
  } : null;

  return (
    <>
      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          <div className="col-span-2">
            <ProductImages images={product.images} />
          </div>
          <div className="col-span-2 p-5">
            <ProductDetails product={product} />
          </div>
          <ProductActions
            product={serializedProduct}
            cart={serializedCart}
          />
        </div>
      </section>
    </>
  );
};

export default ProductDetailsPage;
