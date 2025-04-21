import { OrderDto } from '@/domain/dtos';
import { OrderItemMapper } from './order-item.mapper';
import { Decimal } from '@prisma/client/runtime/library';

export type OrderWithItems = {
  id: string;
  userId: string;
  shippingAddress: any; // JSON field
  paymentMethod: string;
  paymentResult: any | null; // JSON field
  itemsPrice: Decimal;
  shippingPrice: Decimal;
  taxPrice: Decimal;
  totalPrice: Decimal;
  isPaid: boolean;
  paidAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
  createdAt: Date;
  OrderItem: Array<{
    orderId: string;
    productId: string;
    qty: number;
    price: Decimal;
    name: string;
    slug: string;
    image: string;
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

export class OrderMapper {
  public static toDto(order: OrderWithItems): OrderDto {
    return {
      id: order.id,
      userId: order.userId,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      paymentResult: order.paymentResult,
      itemsPrice: Number(order.itemsPrice),
      shippingPrice: Number(order.shippingPrice),
      taxPrice: Number(order.taxPrice),
      totalPrice: Number(order.totalPrice),
      isPaid: order.isPaid,
      paidAt: order.paidAt,
      isDelivered: order.isDelivered,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      orderItemDtos: order.OrderItem.map(item => OrderItemMapper.toDto(item)),
    };
  }

  public static toPrisma(orderDto: OrderDto): {
    user: { connect: { id: string } };
    shippingAddress: any;
    paymentMethod: string;
    paymentResult: any | null;
    itemsPrice: number;
    shippingPrice: number;
    taxPrice: number;
    totalPrice: number;
    isPaid: boolean;
    paidAt: Date | null;
    isDelivered: boolean;
    deliveredAt: Date | null;
  } {
    return {
      user: { connect: { id: orderDto.userId } },
      shippingAddress: orderDto.shippingAddress,
      paymentMethod: orderDto.paymentMethod,
      paymentResult: orderDto.paymentResult,
      itemsPrice: orderDto.itemsPrice,
      shippingPrice: orderDto.shippingPrice,
      taxPrice: orderDto.taxPrice,
      totalPrice: orderDto.totalPrice,
      isPaid: orderDto.isPaid,
      paidAt: orderDto.paidAt,
      isDelivered: orderDto.isDelivered,
      deliveredAt: orderDto.deliveredAt,
    };
  }

  public static toPrismaWithItems(orderDto: OrderDto): {
    order: {
      user: { connect: { id: string } };
      shippingAddress: any;
      paymentMethod: string;
      paymentResult: any | null;
      itemsPrice: number;
      shippingPrice: number;
      taxPrice: number;
      totalPrice: number;
      isPaid: boolean;
      paidAt: Date | null;
      isDelivered: boolean;
      deliveredAt: Date | null;
    };
    items: Array<{
      orderId: string;
      productId: string;
      qty: number;
      price: number;
      name: string;
      slug: string;
      image: string;
    }>;
  } {
    return {
      order: this.toPrisma(orderDto),
      items: orderDto.orderItemDtos.map(item => OrderItemMapper.toPrisma(item)),
    };
  }
} 