import { OrderItemDto } from './order-item.dto';
import { ShippingAddress } from '../../lib/contracts/shipping-address';

// Define OrderStatus enum
export enum OrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PAYMENT_FAILED = 'payment_failed',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

// Define specific interfaces for the JSON fields
export interface PaymentResult {
  id?: string;
  status?: string;
  updateTime?: string;
  emailAddress?: string;
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
    public readonly status: OrderStatus,
    public readonly isPaid: boolean,
    public readonly paidAt: Date | null,
    public readonly isDelivered: boolean,
    public readonly deliveredAt: Date | null,
    public readonly trackingNumber: string | null,
    public readonly customerNotes: string | null,
    public readonly internalNotes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly orderItemDtos: OrderItemDto[],
  ) {
  }
}
