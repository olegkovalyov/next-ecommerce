import ProductPrice from '@/presentation/components/shared/product/product-price';
import { ReactElement } from 'react';
import { ProductDto } from '@/domain/dtos';

const ProductDetails = ({ productDto }: { productDto: ProductDto }): ReactElement => {

  return (
    <>
      <div className="flex flex-col gap-6">
        <p>
          {productDto.brand} {productDto.category}
        </p>
        <h1 className="h3-bold">{productDto.name}</h1>
        <p>
          {productDto.rating} of {productDto.numReviews} Reviews
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <ProductPrice
            value={Number(productDto.price)}
            className="w-24 rounded-full bg-green-100 text-green-700 px-5 py-2"
          />
        </div>
      </div>
      <div className="mt-10">
        <p className="font-semibold">Description</p>
        <p>{productDto.description}</p>
      </div>
    </>
  );
};

export default ProductDetails;
