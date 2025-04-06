import { CartItemDto } from './cart-item.dto';

export interface CartDto {
  readonly id?: string;
  readonly userId: string | null;
  readonly shippingPrice: number;
  readonly taxPercentage: number;
  readonly cartItemDtos: CartItemDto[];
}
