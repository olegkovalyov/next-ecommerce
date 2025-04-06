import { ProductDto } from './product.dto';

export class CartItemDto {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly productDto: ProductDto,
  ) {
  }
}
