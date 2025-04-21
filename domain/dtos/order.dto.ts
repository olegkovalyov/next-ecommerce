import { OrderItemDto } from './order-item.dto';
import { ShippingAddress } from '@/lib/contracts/shipping-address';

// Define specific interfaces for the JSON fields

export interface PaymentResult {
  id?: string;
  status?: string;
  update_time?: string;
  email_address?: string;
  [key: string]: string | undefined; // Allow for additional fields
}

export class OrderDto {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly shippingAddress: ShippingAddress,
    public readonly paymentMethod: string,
    public readonly paymentResult: PaymentResult | null,
    public readonly itemsPrice: number,
    public readonly shippingPrice: number,
    public readonly taxPrice: number,
    public readonly totalPrice: number,
    public readonly isPaid: boolean,
    public readonly paidAt: Date | null,
    public readonly isDelivered: boolean,
    public readonly deliveredAt: Date | null,
    public readonly createdAt: Date,
    public readonly orderItemDtos: OrderItemDto[],
  ) {
  }
}
