import {Card, CardContent, CardHeader} from '@/presentation/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import ProductPrice from '@/presentation/components/shared/product/product-price';
import { ReactElement } from 'react';
import { ProductDto } from '@/domain/dtos';

const ProductCard = ({productDto}: { productDto: ProductDto }): ReactElement => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-0 items-center">
        <Link href={`/product/${productDto.slug}`}>
          <Image
            src={productDto.images[0]}
            alt={productDto.name}
            height={300}
            width={300}
            priority={true}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 grid gap-4">
        <div className="text-xs">{productDto.brand}</div>
        <Link href={`/products/${productDto.slug}`}>
          <h2 className="text-sm font-medium">{productDto.name}</h2>
        </Link>
        <div className="flex-between gap-4">
          <p>{productDto.rating} Stars</p>
          {productDto.stock > 0 ? (
            <ProductPrice value={Number(productDto.price)} />
          ) : (
            <p className="text-destructive">Out Of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
