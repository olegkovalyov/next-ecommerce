'use server';

import { PrismaClient } from '@prisma/client';
import { OrderEntity } from '@/domain/entities/order.entity';
import { OrderRepository } from '@/infrastructure/repositories/order.repository';
import { OrderDto, PaymentResult } from '@/domain/dtos/order.dto';
import { auth } from '@/infrastructure/auth/auth';
import { failure, Result, success } from '@/lib/result';
import { CartService } from '@/application/services/cart/cart.service';
import { OrderItemDto } from '@/domain/dtos';
import { ShippingAddress } from '@/lib/contracts/shipping-address';

export async function createOrder(): Promise<Result<string>> {

  const user = (await auth())?.user;
  if (!user) {
    return failure(new Error('User is not authenticated'));
  }

  const cartResult = await CartService.loadByUserId(user.id);
  if (!cartResult.success) {
    return failure(new Error('Cart not found'));
  }
  const cart = cartResult.value;

  const orderId = crypto.randomUUID();
  const orderItemDtos: OrderItemDto[] = cart.toDto().cartItemDtos.map(cartItem => {
    return new OrderItemDto(
      orderId,
      cartItem.productId,
      cartItem.quantity,
      cartItem.productDto.price,
      cartItem.productDto.name,
      cartItem.productDto.slug,
      cartItem.productDto.images[0],
      cartItem.productDto,
    );
  });

  const shippingAddress = new ShippingAddress(
    user.name,
    '123 Test St',
    'Test City',
    '12345',
    'Ukraine',
  );

  const paymentResult: PaymentResult = {
    id: '',
    status: '',
    update_time: '',
    email_address: '',
  };

  const orderDto = new OrderDto(
    orderId,
    user.id,
    shippingAddress,
    'PayPal',
    paymentResult,
    cart.calculateItemsPrice(),
    0,
    cart.calculateTaxPrice(),
    cart.calculateTotalPrice(),
    false,
    null,
    false,
    null,
    new Date(),
    orderItemDtos,
  );
  // Create order entity from DTO
  const orderEntityResult = OrderEntity.fromDto(orderDto);
  if (!orderEntityResult.success) {
    throw new Error('Failed to create order entity');
  }

  const orderEntity = orderEntityResult.value;

  // Save order using repository
  const orderRepository = new OrderRepository(new PrismaClient());
  const saveResult = await orderRepository.save(orderEntity);

  if (!saveResult.success) {
    throw new Error('Failed to save order');
  }

  return success(orderDto.id);
}
