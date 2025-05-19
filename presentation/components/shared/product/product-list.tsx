import ProductCard from '@/presentation/components/shared/product/product-card';
import { ReactElement } from 'react';
import { ProductDto } from '@/domain/dtos';

const ProductList = ({ data, title, limit }: { data: Array<ProductDto>; title?: string; limit?: number }): ReactElement => {

  const limitedData = limit ? data.slice(0, limit) : data;

  return (
    <div className="my-10">
      <h2 className="h2-bold mb-4">{title}</h2>
      {data.length > 0 ? (

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {limitedData.map((productDto: ProductDto) => (
            <ProductCard key={productDto.slug} productDto={productDto} />
          ))}
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
