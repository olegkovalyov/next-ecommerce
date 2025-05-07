import { ProductDto } from './product.dto';

export class OrderItemDto {
  constructor(
    public readonly id: string,
    public readonly orderId: string | null,
    public readonly productId: string | null,
    public readonly quantity: number,
    public readonly price: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly image: string,
    public readonly productDto?: ProductDto,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public productSnapshot?: ProductDto | null,
  ) {
  }
}
