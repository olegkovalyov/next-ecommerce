import { ProductDto } from './product.dto';

export class OrderItemDto {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly qty: number,
    public readonly price: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly image: string,
    public readonly productDto: ProductDto,
  ) {
  }
}
