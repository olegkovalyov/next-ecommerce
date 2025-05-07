import { OrderEntity } from '@/domain/entities/order.entity';
import { OrderDto, OrderItemDto, OrderStatus, PaymentResult, ProductDto } from '@/domain/dtos';
import { Result, success, failure } from '@/lib/result';
import { DrizzleClient } from '@/infrastructure/db';
import {
  order as orderTable,
  orderItem as orderItemTable,
  orderProductSnapshot as snapshotTable
} from '../schema/order';
import { eq, sql, inArray } from 'drizzle-orm';
import { OrderRepositoryInterface } from '@/domain/repositories/order-repository.interface';
import { ShippingAddress } from '@/lib/contracts/shipping-address';
import { user as userTable } from '../schema/user';
import { product as productTable } from '../schema/product';

export class DrizzleOrderRepository implements OrderRepositoryInterface {
  constructor(private readonly db: DrizzleClient) {}

  // Private method to find by ID, accepting a DrizzleClient (db or transaction)
  private async _findById(dbClient: DrizzleClient, id: string): Promise<Result<OrderEntity>> {
    try {
      // Fetch order
      const orders = await dbClient.select()
        .from(orderTable)
        .where(eq(orderTable.id, id))
        .limit(1);

      if (!orders.length) {
        return failure(new Error('Order not found'));
      }

      // Fetch order items
      const orderItemsResult = await dbClient.select()
        .from(orderItemTable)
        .where(eq(orderItemTable.order_id, id));

      // Fetch product snapshots for order items
      const orderItemDtos: OrderItemDto[] = [];

      for (const item of orderItemsResult) {
        // Make sure item.id is not null
        if (item.id && item.product_id) {
          const snapshots = await dbClient.select()
            .from(snapshotTable)
            .where(sql`${snapshotTable.order_item_id} = ${item.id}`)
            .limit(1);

          const productSnapshotData = snapshots.length ? snapshots[0] : null;

          let productDtoForOrderItem: ProductDto | undefined = undefined;

          if (productSnapshotData) {
            productDtoForOrderItem = {
              id: productSnapshotData.product_id || item.product_id,
              name: productSnapshotData.name,
              slug: productSnapshotData.slug,
              description: productSnapshotData.description || '',
              price: Number(productSnapshotData.price),
              images: productSnapshotData.images || [],
              category: productSnapshotData.category || '',
              brand: productSnapshotData.brand || '',
              stock: productSnapshotData.stock || 0,
              rating: Number(productSnapshotData.rating) || 0,
              numReviews: productSnapshotData.num_reviews || 0,
              isFeatured: productSnapshotData.is_featured ?? false,
              banner: productSnapshotData.banner || null,
              createdAt: productSnapshotData.created_at || new Date(),
              // Ensure all required fields from ProductDto are present
            };
          }

          if (!productDtoForOrderItem) {
            console.error(`Critical: Product data (productDto) could not be formed for order item ${item.id}. Snapshot data:`, productSnapshotData);
            productDtoForOrderItem = {
                id: item.product_id, name: 'Error - Missing Product Data', slug: 'error-missing-product-data',
                price: 0, images: [], category: '', brand: '', stock: 0, description: '',
                rating:0, numReviews:0, isFeatured:false, banner:null, createdAt: new Date()
            } as ProductDto;
          }

          const orderItemDto = new OrderItemDto(
            item.id,
            item.order_id,
            item.product_id,
            item.quantity,
            Number(item.price),
            item.name,
            item.slug,
            item.image,
            productDtoForOrderItem,
            item.created_at || undefined, // Convert null to undefined
            item.updated_at || undefined, // Convert null to undefined
            productDtoForOrderItem
          );

          orderItemDtos.push(orderItemDto);
        }
      }

      // Create order DTO
      const order = orders[0];
      const orderDto: OrderDto = {
        id: order.id,
        userId: order.user_id || '',
        shippingAddress: order.shipping_address as ShippingAddress,
        paymentMethod: order.payment_method,
        paymentResult: order.payment_result as PaymentResult || null,
        itemsPrice: Number(order.items_price),
        shippingPrice: Number(order.shipping_price),
        taxPrice: Number(order.tax_price),
        totalPrice: Number(order.total_price),
        status: order.status as OrderStatus,
        isPaid: Boolean(order.is_paid),
        paidAt: order.paid_at || null,
        isDelivered: Boolean(order.is_delivered),
        deliveredAt: order.delivered_at || null,
        trackingNumber: order.tracking_number || null,
        customerNotes: order.customer_notes || null,
        internalNotes: order.internal_notes || null,
        createdAt: order.created_at || new Date(),
        updatedAt: order.updated_at || new Date(),
        orderItemDtos,
      };

      return OrderEntity.fromDto(orderDto);
    } catch (error) {
      console.error('Failed to find order by ID (internal):', error);
      return failure(error instanceof Error ? error : new Error('Failed to find order (internal)'));
    }
  }

  async findById(id: string): Promise<Result<OrderEntity>> {
    return this._findById(this.db, id);
  }

  async findByUserId(userId: string): Promise<Result<OrderEntity[]>> {
    try {
      const ordersResult = await this.db.select()
        .from(orderTable)
        .where(eq(orderTable.user_id, userId))
        .orderBy(orderTable.created_at);

      if (!ordersResult.length) {
        return success([]);
      }

      const orderEntities: OrderEntity[] = [];

      for (const order of ordersResult) {
        const orderResult = await this.findById(order.id);

        if (orderResult.success) {
          orderEntities.push(orderResult.value);
        }
      }

      return success(orderEntities);
    } catch (error) {
      console.error('Failed to find orders by user ID:', error);
      return failure(new Error('Failed to find orders'));
    }
  }

  async save(order: OrderEntity): Promise<Result<OrderEntity>> {
    const orderDto = order.toDto();

    return this.db.transaction(async (tx) => {
      try {
        const existingOrderResult = await this._findById(tx, orderDto.id);
        const isNewOrder = !existingOrderResult.success;

        // Check if user exists
        if (orderDto.userId) {
          const userExists = await tx.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, orderDto.userId)).limit(1);
          if (userExists.length === 0) {
            console.error(`User with ID ${orderDto.userId} not found within transaction. Cannot save order.`);
            return failure(new Error(`User with ID ${orderDto.userId} not found within transaction. Cannot save order.`));
          }
        }

        const orderData = {
          user_id: orderDto.userId,
          shipping_address: orderDto.shippingAddress,
          payment_method: orderDto.paymentMethod,
          payment_result: orderDto.paymentResult,
          items_price: orderDto.itemsPrice.toString(),
          shipping_price: orderDto.shippingPrice.toString(),
          tax_price: orderDto.taxPrice.toString(),
          total_price: orderDto.totalPrice.toString(),
          status: orderDto.status,
          is_paid: orderDto.isPaid,
          paid_at: orderDto.paidAt,
          is_delivered: orderDto.isDelivered,
          delivered_at: orderDto.deliveredAt,
          tracking_number: orderDto.trackingNumber,
          customer_notes: orderDto.customerNotes,
          internal_notes: orderDto.internalNotes,
          updated_at: new Date(),
        };

        if (isNewOrder) {
          await tx.insert(orderTable).values({
            id: orderDto.id,
            ...orderData,
          });
        } else {
          await tx.update(orderTable)
            .set(orderData)
            .where(eq(orderTable.id, orderDto.id));

          await tx.delete(snapshotTable)
            .where(inArray(snapshotTable.order_item_id, sql`(SELECT id FROM ${sql.identifier('order_items')} WHERE order_id = ${orderDto.id})`));

          await tx.delete(orderItemTable)
            .where(eq(orderItemTable.order_id, orderDto.id));
        }

        for (const itemDto of orderDto.orderItemDtos) {
          // Check if product exists for the item
          if (itemDto.productId) {
            const productExists = await tx.select({ id: productTable.id }).from(productTable).where(eq(productTable.id, itemDto.productId)).limit(1);
            if (productExists.length === 0) {
              console.error(`Product with ID ${itemDto.productId} not found for order item ${itemDto.id}. Cannot save order.`);
              return failure(new Error(`Product with ID ${itemDto.productId} not found for order item ${itemDto.id}. Cannot save order.`));
            }
          }

          const orderItemData = {
            id: itemDto.id || crypto.randomUUID(),
            order_id: orderDto.id,
            product_id: itemDto.productId,
            name: itemDto.name,
            slug: itemDto.slug,
            image: itemDto.image,
            price: itemDto.price.toString(),
            quantity: itemDto.quantity,
          };

          await tx.insert(orderItemTable).values(orderItemData);

          if (itemDto.productSnapshot) {
            await tx.insert(snapshotTable).values({
              id: crypto.randomUUID(),
              order_item_id: orderItemData.id,
              product_id: itemDto.productId,
              name: itemDto.productSnapshot.name,
              slug: itemDto.productSnapshot.slug,
              category: itemDto.productSnapshot.category,
              brand: itemDto.productSnapshot.brand,
              description: itemDto.productSnapshot.description,
              stock: itemDto.productSnapshot.stock,
              price: itemDto.productSnapshot.price.toString(),
              images: itemDto.productSnapshot.images,
              rating: itemDto.productSnapshot.rating.toString(),
              num_reviews: itemDto.productSnapshot.numReviews,
              is_featured: itemDto.productSnapshot.isFeatured,
              banner: itemDto.productSnapshot.banner,
              created_at: new Date(),
            });
          }
        }

        return this._findById(tx, orderDto.id);
      } catch (error) {
        console.error('Failed to save order within transaction:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('Unknown error occurred during save transaction');
        }
      }
    });
  }

  async delete(id: string): Promise<Result<OrderEntity>> {
    try {
      const orderResult = await this.findById(id);

      if (!orderResult.success) {
        return failure(new Error('Order not found'));
      }

      await this.db.delete(snapshotTable)
        .where(inArray(snapshotTable.order_item_id, sql`(SELECT id FROM ${sql.identifier(orderItemTable._.name)} WHERE order_id = ${id})`));
      await this.db.delete(orderItemTable).where(eq(orderItemTable.order_id, id));
      await this.db.delete(orderTable).where(eq(orderTable.id, id));

      return success(orderResult.value);
    } catch (error) {
      console.error('Failed to delete order:', error);
      return failure(new Error('Failed to delete order'));
    }
  }
}
