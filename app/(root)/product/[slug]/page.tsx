import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import ProductImages from '@/components/shared/product/product-images';
import ProductDetails from '@/components/shared/product/product-details';
import ProductActions from '@/components/shared/product/product-actions';
import { loadCart } from '@/lib/actions/cart/load-cart.action';

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const result = await loadCart();
  const cart = result.ok
    ? result.val
    : undefined;

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
          <ProductActions product={product} cart={cart} />
        </div>
      </section>
    </>
  );
};

export default ProductDetailsPage;
