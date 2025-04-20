import { CartItemDto } from '@/domain/dtos';
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

export type PrismaCartItem = {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: Product;
};

export class CartItemMapper {
  public static toDto(cartItem: PrismaCartItem): CartItemDto {
    return {
      id: cartItem.id,
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      productDto: {
        id: cartItem.product.id,
        name: cartItem.product.name,
        slug: cartItem.product.slug,
        category: cartItem.product.category,
        images: cartItem.product.images,
        brand: cartItem.product.brand,
        description: cartItem.product.description,
        stock: cartItem.product.stock,
        price: Number(cartItem.product.price),
        rating: Number(cartItem.product.rating),
        numReviews: cartItem.product.numReviews,
        isFeatured: cartItem.product.isFeatured,
        banner: cartItem.product.banner,
        createdAt: cartItem.product.createdAt,
      },
    };
  }

  public static toPrisma(cartItemDto: CartItemDto): {
    cartId: string;
    productId: string;
    quantity: number;
  } {
    return {
      cartId: cartItemDto.cartId,
      productId: cartItemDto.productId,
      quantity: cartItemDto.quantity,
    };
  }
}
