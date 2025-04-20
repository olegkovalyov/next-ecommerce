import { CartDto } from '@/domain/dtos';
import { CartItemMapper } from './cart-item.mapper';
import { Decimal } from '@prisma/client/runtime/library';

export type CartWithItems = {
  id: string;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    product: {
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
  }>;
};

export class CartMapper {
  public static toDto(cart: CartWithItems): CartDto {
    return {
      id: cart.id,
      userId: cart.userId,
      taxPercentage: 0, // Hardcoded to 0 as per requirements
      cartItemDtos: cart.items.map(item => CartItemMapper.toDto(item)),
    };
  }

  public static toPrisma(cartDto: CartDto): {
    user: { connect: { id: string } } | null;
  } {
    return {
      user: cartDto.userId ? { connect: { id: cartDto.userId } } : null,
    };
  }

  public static toPrismaWithItems(cartDto: CartDto): {
    cart: {
      user: { connect: { id: string } } | null;
    };
    items: Array<{
      cartId: string;
      productId: string;
      quantity: number;
    }>;
  } {
    return {
      cart: this.toPrisma(cartDto),
      items: cartDto.cartItemDtos.map(item => CartItemMapper.toPrisma(item)),
    };
  }
}
