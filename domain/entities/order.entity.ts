import { OrderItemEntity } from './order-item.entity';
import { failure, Result, success } from '@/lib/result';
import { OrderDto, OrderItemDto, PaymentResult, OrderStatus } from '../dtos';
import { ShippingAddress } from '@/lib/contracts/shipping-address.ts';

export class OrderEntity {
  public readonly id: string;
  public readonly userId: string;
  public readonly shippingAddress: ShippingAddress;
  public readonly paymentMethod: string;
  public readonly paymentResult: PaymentResult | null;
  public readonly itemsPrice: number;
  public readonly shippingPrice: number;
  public readonly taxPrice: number;
  public readonly totalPrice: number;
  public readonly status: OrderStatus;
  public readonly isPaid: boolean;
  public readonly paidAt: Date | null;
  public readonly isDelivered: boolean;
  public readonly deliveredAt: Date | null;
  public readonly trackingNumber: string | null;
  public readonly customerNotes: string | null;
  public readonly internalNotes: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  orderItems: Map<string, OrderItemEntity> = new Map();

  private constructor(orderData: OrderDto) {
    this.id = orderData.id ? orderData.id : crypto.randomUUID();
    this.userId = orderData.userId;
    this.shippingAddress = orderData.shippingAddress;
    this.paymentMethod = orderData.paymentMethod;
    this.paymentResult = orderData.paymentResult;
    this.itemsPrice = orderData.itemsPrice;
    this.shippingPrice = orderData.shippingPrice;
    this.taxPrice = orderData.taxPrice;
    this.totalPrice = orderData.totalPrice;
    this.status = orderData.status;
    this.isPaid = orderData.isPaid;
    this.paidAt = orderData.paidAt;
    this.isDelivered = orderData.isDelivered;
    this.deliveredAt = orderData.deliveredAt;
    this.trackingNumber = orderData.trackingNumber;
    this.customerNotes = orderData.customerNotes;
    this.internalNotes = orderData.internalNotes;
    this.createdAt = orderData.createdAt;
    this.updatedAt = orderData.updatedAt;
    this.initOrderItemsFromDtos(orderData.orderItemDtos);
  }

  public static fromDto(orderData: OrderDto): Result<OrderEntity> {
    try {
      const order = new OrderEntity(orderData);
      return success(order);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Failed to create order from DTO'));
    }
  }

  public static create(orderData: OrderDto): Result<OrderEntity> {
    return OrderEntity.fromDto(orderData);
  }

  public calculateItemsPrice(): number {
    let total = 0;
    this.orderItems.forEach(item => {
      total += item.calculateSubtotal();
    });
    return this.roundToTwoDecimals(total);
  }

  public calculateTotalPrice(): number {
    return this.roundToTwoDecimals(this.itemsPrice + this.shippingPrice + this.taxPrice);
  }

  public toDto(): OrderDto {
    return {
      id: this.id,
      userId: this.userId,
      shippingAddress: this.shippingAddress,
      paymentMethod: this.paymentMethod,
      paymentResult: this.paymentResult,
      itemsPrice: this.itemsPrice,
      shippingPrice: this.shippingPrice,
      taxPrice: this.taxPrice,
      totalPrice: this.totalPrice,
      status: this.status,
      isPaid: this.isPaid,
      paidAt: this.paidAt,
      isDelivered: this.isDelivered,
      deliveredAt: this.deliveredAt,
      trackingNumber: this.trackingNumber,
      customerNotes: this.customerNotes,
      internalNotes: this.internalNotes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      orderItemDtos: Array.from(this.orderItems.values()).map(item => item.toDto()),
    };
  }

  public addOrderItem(orderItem: OrderItemEntity): Result<OrderEntity> {
    if (orderItem.orderId !== this.id) {
      return failure(new Error('Order item belongs to a different order'));
    }

    if (orderItem.productId) {
      this.orderItems.set(orderItem.productId, orderItem);
    }
    return success(this);
  }

  public removeOrderItem(productId: string): Result<OrderEntity> {
    if (!this.orderItems.has(productId)) {
      return failure(new Error('Order item not found'));
    }

    this.orderItems.delete(productId);
    return success(this);
  }

  public markAsPaid(): Result<OrderEntity> {
    if (this.isPaid) {
      return failure(new Error('Order is already marked as paid'));
    }

    const updatedOrder = new OrderEntity({
      ...this.toDto(),
      isPaid: true,
      paidAt: new Date(),
    });

    return success(updatedOrder);
  }

  public markAsDelivered(): Result<OrderEntity> {
    if (!this.isPaid) {
      return failure(new Error('Order must be paid before it can be delivered'));
    }

    if (this.isDelivered) {
      return failure(new Error('Order is already marked as delivered'));
    }

    const updatedOrder = new OrderEntity({
      ...this.toDto(),
      isDelivered: true,
      deliveredAt: new Date(),
    });

    return success(updatedOrder);
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private initOrderItemsFromDtos(orderItemsDtos: OrderItemDto[]): void {
    this.orderItems.clear();

    if (!orderItemsDtos || orderItemsDtos.length === 0) {
      return;
    }

    for (const itemDto of orderItemsDtos) {
      const orderItemResult = OrderItemEntity.fromDto(itemDto);
      if (!orderItemResult.success) {
        throw new Error(`Failed to initialize order item (id: ${itemDto.id}, product_id: ${itemDto.productId}): ${orderItemResult.error.message}`);
      }
      if (!orderItemResult.value.productId) {
        continue;
      }
      this.orderItems.set(orderItemResult.value.productId, orderItemResult.value);
    }
  }

  getOrderItemsArray(): OrderItemEntity[] {
    return Array.from(this.orderItems.values());
  }
}
