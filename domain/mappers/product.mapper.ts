import { ProductDto } from '../product.entity';
import { Product as PrismaProduct, Prisma } from '@prisma/client';

export class ProductMapper {
  static toDto(prismaProduct: PrismaProduct): ProductDto {
    return {
      id: prismaProduct.id,
      name: prismaProduct.name,
      slug: prismaProduct.slug,
      category: prismaProduct.category,
      brand: prismaProduct.brand,
      description: prismaProduct.description,
      stock: prismaProduct.stock,
      images: prismaProduct.images,
      isFeatured: prismaProduct.isFeatured,
      banner: prismaProduct.banner,
      price: Number(prismaProduct.price),
      rating: prismaProduct.rating.toString(),
      numReviews: prismaProduct.numReviews,
      createdAt: prismaProduct.createdAt,
    };
  }

  static toPrisma(productDto: ProductDto): Partial<PrismaProduct> {
    return {
      id: productDto.id,
      name: productDto.name,
      slug: productDto.slug,
      category: productDto.category,
      brand: productDto.brand,
      description: productDto.description,
      stock: productDto.stock,
      images: productDto.images,
      isFeatured: productDto.isFeatured,
      banner: productDto.banner,
      price: new Prisma.Decimal(productDto.price),
      rating: new Prisma.Decimal(productDto.rating),
      numReviews: productDto.numReviews,
      createdAt: productDto.createdAt,
    };
  }
} 