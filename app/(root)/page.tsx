import ProductList from '@/presentation/components/shared/product/product-list';
import { getLatestProducts } from '@/lib/actions/product.actions';
import { ReactElement } from 'react';

const Homepage = async (): Promise<ReactElement> => {

  const latestProducts = await getLatestProducts();


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
