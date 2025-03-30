import {ProductInterface} from '@/lib/contracts/product';
import ProductCard from '@/components/shared/product/product-card';

const ProductList = ({data, title}: { data: Array<ProductInterface>; title?: string }) => {
  return (
    <div className="my-10">
      <h2 className="h2-bold mb-4">{title}</h2>
      {data.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.map((product: ProductInterface) => (
              <ProductCard product={product} key={product.slug}/>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p>No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductList;
