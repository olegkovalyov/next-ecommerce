'use server';

import { OrderEntity } from '@/domain/entities/order.entity';
import { OrderDto, PaymentResult, OrderStatus } from '@/domain/dtos/order.dto';
import { auth } from '@/infrastructure/auth/auth';
import { failure, Result, success } from '@/lib/result';
import { OrderItemDto } from '@/domain/dtos';
import { ShippingAddress } from '@/lib/contracts/shipping-address';
import { db } from '@/infrastructure/db';
import { Container } from '@/lib/di';
import { DrizzleOrderRepository } from '@/infrastructure/db/repositories/order/order.repository.ts';

export async function createOrder(): Promise<Result<string>> {

  const user = (await auth())?.user;
  if (!user) {
    return failure(new Error('User is not authenticated'));
  }

  const cartResult = await Container.getInstance().getCartService().loadByUserId(user.id);
  if (!cartResult.success) {
    return failure(new Error('Cart not found'));
  }
  const cart = cartResult.value;

  const orderId = crypto.randomUUID();
  const now = new Date();

  const orderItemDtos: OrderItemDto[] = cart.toDto().cartItemDtos.map(cartItem => {
    return new OrderItemDto(
      crypto.randomUUID(),
      orderId,
      cartItem.productId,
      cartItem.quantity,
      cartItem.productDto.price,
      cartItem.productDto.name,
      cartItem.productDto.slug,
      cartItem.productDto.images[0] || '',
      cartItem.productDto,
      now,
      now
    );
  });

  const shippingAddress = new ShippingAddress(
    user.name || 'Test User',
    '123 Test St',
    'Test City',
    '12345',
    'Ukraine',
  );

  const paymentResult: PaymentResult | null = null;

  const orderDto = new OrderDto(
    orderId,                        // 1. id
    user.id,                        // 2. userId
    shippingAddress,                // 3. shippingAddress
    'PayPal',                       // 4. paymentMethod
    paymentResult,                  // 5. paymentResult
    cart.calculateItemsPrice(),     // 6. itemsPrice
    0,                              // 7. shippingPrice
    cart.calculateTaxPrice(),       // 8. taxPrice
    cart.calculateTotalPrice(),     // 9. totalPrice
    OrderStatus.PENDING_PAYMENT,    // 10. status
    false,                          // 11. isPaid
    null,                           // 12. paidAt
    false,                          // 13. isDelivered
    null,                           // 14. deliveredAt
    null,                           // 15. trackingNumber
    null,                           // 16. customerNotes
    null,                           // 17. internalNotes
    now,                            // 18. createdAt
    now,                            // 19. updatedAt
    orderItemDtos                   // 20. orderItemDtos
  );

  // Create order entity from DTO
  const orderEntityResult = OrderEntity.fromDto(orderDto);
  if (!orderEntityResult.success) {
    throw new Error('Failed to create order entity');
  }

  const orderEntity = orderEntityResult.value;

  // Save order using repository
  const orderRepository = new DrizzleOrderRepository(db);
  const saveResult = await orderRepository.save(orderEntity);

  if (!saveResult.success) {
    throw new Error('Failed to save order');
  }

  return success(orderDto.id);
}
