import ProductList from '@/components/shared/product/product-list';
import { getLatestProducts } from '@/lib/actions/product.actions';
import { auth } from '@/auth';

const Homepage = async () => {

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
