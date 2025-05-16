import { notFound } from 'next/navigation';
import ProductDetails from '@/presentation/components/shared/product/product-details';
import ProductImages from '@/presentation/components/shared/product/product-images';
import ProductActions from '@/presentation/components/shared/product/product-actions';
import { ReactElement } from 'react';
import { Container } from '@/lib/di/container';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage(
  {
    params,
  }: ProductPageProps): Promise<ReactElement> {
  const { slug } = await params;

  // Get properly configured ProductService from the DI container
  const productService = Container.getInstance().getProductService();

  const productLoadResult = await productService.loadProductBySlug(slug);
  if (!productLoadResult.success) {
    return notFound();
  }

  // Convert product to plain object and serialize for client components
  const productDto = productLoadResult.value.toDto();

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-5">
        <div className="col-span-2">
          <ProductImages images={productDto.images} />
        </div>
        <div className="col-span-2 p-5">
          <ProductDetails productDto={productDto} />
        </div>
        <ProductActions
          productDto={productDto}
        />
      </div>
    </section>
  );
}
