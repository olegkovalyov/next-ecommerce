import { ProductDto } from '@/domain/dtos';
import { Product } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

type ExtendedProduct = Omit<Product, 'price' | 'rating'> & {
  price: string;
  rating: string;
};

export class ProductMapper {
  public static toDto(product: ExtendedProduct): ProductDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      brand: product.brand,
      description: product.description,
      stock: product.stock,
      images: product.images,
      isFeatured: product.isFeatured,
      banner: product.banner,
      price: Number(product.price),
      rating: Number(product.rating),
      numReviews: product.numReviews,
      createdAt: product.createdAt,
    };
  }

  public static toPrisma(productDto: ProductDto): Omit<Product, 'id' | 'createdAt'> {
    return {
      name: productDto.name,
      slug: productDto.slug,
      category: productDto.category,
      brand: productDto.brand,
      description: productDto.description,
      stock: productDto.stock,
      images: productDto.images,
      isFeatured: productDto.isFeatured,
      banner: productDto.banner,
      price: new Decimal(productDto.price),
      rating: new Decimal(productDto.rating),
      numReviews: productDto.numReviews,
    };
  }
}
