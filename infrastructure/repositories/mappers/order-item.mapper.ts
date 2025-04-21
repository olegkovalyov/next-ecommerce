import { OrderItemDto } from '@/domain/dtos';
import { Decimal } from '@prisma/client/runtime/library';

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  images: string[];
  brand: string;
  description: string;
  stock: number;
  price: Decimal;
  rating: Decimal;
  numReviews: number;
  isFeatured: boolean;
  banner: string | null;
  createdAt: Date;
};

export type PrismaOrderItem = {
  orderId: string;
  productId: string;
  qty: number;
  price: Decimal;
  name: string;
  slug: string;
  image: string;
  product: Product;
};

export class OrderItemMapper {
  public static toDto(orderItem: PrismaOrderItem): OrderItemDto {
    return {
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      qty: orderItem.qty,
      price: Number(orderItem.price),
      name: orderItem.name,
      slug: orderItem.slug,
      image: orderItem.image,
      productDto: {
        id: orderItem.product.id,
        name: orderItem.product.name,
        slug: orderItem.product.slug,
        category: orderItem.product.category,
        images: orderItem.product.images,
        brand: orderItem.product.brand,
        description: orderItem.product.description,
        stock: orderItem.product.stock,
        price: Number(orderItem.product.price),
        rating: Number(orderItem.product.rating),
        numReviews: orderItem.product.numReviews,
        isFeatured: orderItem.product.isFeatured,
        banner: orderItem.product.banner,
        createdAt: orderItem.product.createdAt,
      },
    };
  }

  public static toPrisma(orderItemDto: OrderItemDto): {
    orderId: string;
    productId: string;
    qty: number;
    price: number;
    name: string;
    slug: string;
    image: string;
  } {
    return {
      orderId: orderItemDto.orderId,
      productId: orderItemDto.productId,
      qty: orderItemDto.qty,
      price: orderItemDto.price,
      name: orderItemDto.name,
      slug: orderItemDto.slug,
      image: orderItemDto.image,
    };
  }
} 