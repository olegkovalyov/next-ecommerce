import { ProductDto } from './product.dto';

export interface CartItemDto {
  readonly id?: string;
  readonly cartId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly productDto: ProductDto;
}
