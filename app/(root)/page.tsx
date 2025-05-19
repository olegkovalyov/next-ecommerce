import ProductList from '@/presentation/components/shared/product/product-list';
import { ReactElement } from 'react';
import { Container } from '@/lib/di';

const Homepage = async (): Promise<ReactElement> => {

  const productService = Container.getInstance().getProductService();
  const result = await productService.getLatestProducts(10);
  if (!result.success) throw new Error(result.error?.message || 'Failed to fetch products');
  const latestProducts = result.value.map(entity => entity.toDto());

  return (
    <>
      <ProductList
        data={latestProducts}
        title="Newest Arrivals"
        limit={4}
      />
    </>
  );
};

export default Homepage;
