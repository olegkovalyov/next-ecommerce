import { OrderEntity } from '@/domain/entities/order.entity';
import { OrderMapper, OrderWithItems } from './mappers/order.mapper';
import { failure, Result, success } from '@/lib/result';
import { PrismaClient } from '@prisma/client';

export class OrderRepository {
  constructor(private readonly prisma: PrismaClient) {
  }

  async findById(id: string): Promise<Result<OrderEntity>> {
    try {
      const data = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: {
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      return OrderEntity.fromDto(OrderMapper.toDto(data as unknown as OrderWithItems));
    } catch (error) {
      return failure(new Error('Order not found'));
    }
  }

  async findByUserId(userId: string): Promise<Result<OrderEntity[]>> {
    try {
      const data = await this.prisma.order.findMany({
        where: { userId },
        include: {
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      const orders: OrderEntity[] = [];
      for (const order of data) {
        const result = OrderEntity.fromDto(OrderMapper.toDto(order as unknown as OrderWithItems));
        if (result.success) {
          orders.push(result.value);
        }
      }

      return success(orders);
    } catch (error) {
      return failure(new Error('Failed to find orders'));
    }
  }

  async save(order: OrderEntity): Promise<Result<OrderEntity>> {
    try {
      const { order: prismaOrder, items: prismaItems } = OrderMapper.toPrismaWithItems(order.toDto());

      // First, create or update the order
      await this.prisma.order.upsert({
        where: { id: order.id },
        create: {
          id: order.id,
          userId: order.userId,
          shippingAddress: prismaOrder.shippingAddress,
          paymentMethod: prismaOrder.paymentMethod,
          paymentResult: prismaOrder.paymentResult,
          itemsPrice: prismaOrder.itemsPrice,
          shippingPrice: prismaOrder.shippingPrice,
          taxPrice: prismaOrder.taxPrice,
          totalPrice: prismaOrder.totalPrice,
          isPaid: prismaOrder.isPaid,
          paidAt: prismaOrder.paidAt,
          isDelivered: prismaOrder.isDelivered,
          deliveredAt: prismaOrder.deliveredAt,
        },
        update: {
          shippingAddress: prismaOrder.shippingAddress,
          paymentMethod: prismaOrder.paymentMethod,
          paymentResult: prismaOrder.paymentResult,
          itemsPrice: prismaOrder.itemsPrice,
          shippingPrice: prismaOrder.shippingPrice,
          taxPrice: prismaOrder.taxPrice,
          totalPrice: prismaOrder.totalPrice,
          isPaid: prismaOrder.isPaid,
          paidAt: prismaOrder.paidAt,
          isDelivered: prismaOrder.isDelivered,
          deliveredAt: prismaOrder.deliveredAt,
        },
        include: {
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      // Then, handle the items
      if (prismaItems.length > 0) {
        // Delete existing items
        await this.prisma.orderItem.deleteMany({
          where: { orderId: order.id },
        });

        // Create new items
        await this.prisma.orderItem.createMany({
          data: prismaItems.map(item => ({
            orderId: order.id,
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            name: item.name,
            slug: item.slug,
            image: item.image,
          })),
        });
      }

      // Fetch the updated order with items
      const updatedOrder = await this.prisma.order.findUnique({
        where: { id: order.id },
        include: {
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!updatedOrder) {
        return failure(new Error('Failed to fetch updated order'));
      }

      return OrderEntity.fromDto(OrderMapper.toDto(updatedOrder as unknown as OrderWithItems));
    } catch (error) {
      console.error('Error saving order:', error);
      return failure(new Error('Failed to save order'));
    }
  }

  async delete(id: string): Promise<Result<OrderEntity>> {
    try {
      const order = await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: {
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });

      await this.prisma.order.delete({
        where: { id },
      });

      return OrderEntity.fromDto(OrderMapper.toDto(order as unknown as OrderWithItems));
    } catch (error) {
      return failure(new Error('Failed to delete order'));
    }
  }
}
