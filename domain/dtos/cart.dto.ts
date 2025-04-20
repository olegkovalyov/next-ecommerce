import { CartItemDto } from './cart-item.dto';

export class CartDto {
  constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly taxPercentage: number,
    public readonly cartItemDtos: CartItemDto[],
  ) {
  }
}
