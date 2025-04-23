import { PrismaClient } from '@prisma/client';
import { OrderRepository } from '../order.repository';
import { OrderEntity } from '@/domain/entities/order.entity';
import { OrderDto } from '@/domain/dtos/order.dto';
import { OrderItemDto } from '@/domain/dtos/order-item.dto';
import { ShippingAddress } from '@/lib/contracts/shipping-address';
import { ProductDto } from '@/domain/dtos/product.dto';
import crypto from 'crypto';

describe('OrderRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: OrderRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new OrderRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('findByUserId', () => {
    it('should return empty array when no orders exist', async () => {
      const testUserId = crypto.randomUUID();
      const result = await repository.findByUserId(testUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should return orders when they exist', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      // Create test order
      const orderId = crypto.randomUUID();
      const order = await prisma.order.create({
        data: {
          id: orderId,
          userId: testUserId,
          shippingAddress: {
            fullName: 'Test User',
            streetAddress: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          itemsPrice: 100,
          shippingPrice: 10,
          taxPrice: 5,
          totalPrice: 115,
          isPaid: false,
          isDelivered: false,
        },
      });

      try {
        const result = await repository.findByUserId(testUserId);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toHaveLength(1);
          expect(result.value[0]).toBeInstanceOf(OrderEntity);
          expect(result.value[0].id).toBe(order.id);
        }
      } finally {
        // Cleanup
        await prisma.order.deleteMany({ where: { id: orderId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });
  });

  describe('save', () => {
    it('should create new order', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      try {
        const orderDto = new OrderDto(
          '',
          testUserId,
          new ShippingAddress(
            'Test User',
            '123 Test St',
            'Test City',
            '12345',
            'Test Country'
          ),
          'PayPal',
          null,
          100,
          10,
          5,
          115,
          false,
          null,
          false,
          null,
          new Date(),
          []
        );

        const orderEntity = OrderEntity.fromDto(orderDto);
        if (!orderEntity.success) {
          throw new Error('Failed to create order entity');
        }

        const result = await repository.save(orderEntity.value);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBeInstanceOf(OrderEntity);
          expect(result.value.id).toBeTruthy();
          expect(result.value.userId).toBe(testUserId);
        }
      } finally {
        // Cleanup
        await prisma.order.deleteMany({ where: { userId: testUserId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should update existing order with items', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      // Create test product
      const testProductId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${crypto.randomUUID()}`,
          category: 'Test Category',
          brand: 'Test Brand',
          description: 'Test Description',
          stock: 10,
          images: ['test-image.jpg'],
          price: 100,
          rating: 4.5,
          numReviews: 0,
        },
      });

      // Create initial order
      const orderId = crypto.randomUUID();
      const order = await prisma.order.create({
        data: {
          id: orderId,
          userId: testUserId,
          shippingAddress: {
            fullName: 'Test User',
            streetAddress: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          itemsPrice: 100,
          shippingPrice: 10,
          taxPrice: 5,
          totalPrice: 115,
          isPaid: false,
          isDelivered: false,
        },
      });

      try {
        const productDto = new ProductDto(
          testProductId,
          'Test Product',
          'test-product',
          'Test Category',
          'Test Brand',
          'Test Description',
          10,
          ['test-image.jpg'],
          100,
          4.5,
          0,
          false,
          null,
          new Date()
        );

        const orderItemDto = new OrderItemDto(
          orderId,
          testProductId,
          2,
          100,
          'Test Product',
          'test-product',
          'test-image.jpg',
          productDto
        );

        const orderDto = new OrderDto(
          orderId,
          testUserId,
          new ShippingAddress(
            'Test User',
            '123 Test St',
            'Test City',
            '12345',
            'Test Country'
          ),
          'PayPal',
          null,
          200,
          10,
          5,
          215,
          false,
          null,
          false,
          null,
          new Date(),
          [orderItemDto]
        );

        const orderEntity = OrderEntity.fromDto(orderDto);
        if (!orderEntity.success) {
          throw new Error('Failed to create order entity');
        }

        const result = await repository.save(orderEntity.value);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toBeInstanceOf(OrderEntity);
          expect(result.value.id).toBe(orderId);
          const orderItems = result.value.getOrderItemsArray();
          expect(orderItems).toHaveLength(1);
          expect(orderItems[0].productId).toBe(testProductId);
          expect(orderItems[0].qty).toBe(2);
        }
      } finally {
        // Cleanup
        await prisma.orderItem.deleteMany({ where: { orderId: orderId } });
        await prisma.order.deleteMany({ where: { id: orderId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });
  });

  describe('delete', () => {
    it('should delete order and its items', async () => {
      // Create test user
      const testUserId = crypto.randomUUID();
      const user = await prisma.user.create({
        data: {
          id: testUserId,
          name: 'Test User',
          email: `test-${Date.now()}@example.com`,
          password: 'password',
        },
      });

      // Create test product
      const testProductId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${crypto.randomUUID()}`,
          category: 'Test Category',
          brand: 'Test Brand',
          description: 'Test Description',
          stock: 10,
          images: ['test-image.jpg'],
          price: 100,
          rating: 4.5,
          numReviews: 0,
        },
      });

      // Create test order with items
      const orderId = crypto.randomUUID();
      const order = await prisma.order.create({
        data: {
          id: orderId,
          userId: testUserId,
          shippingAddress: {
            fullName: 'Test User',
            streetAddress: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
          },
          paymentMethod: 'PayPal',
          itemsPrice: 100,
          shippingPrice: 10,
          taxPrice: 5,
          totalPrice: 115,
          isPaid: false,
          isDelivered: false,
          OrderItem: {
            create: {
              productId: testProductId,
              qty: 2,
              price: 100,
              name: 'Test Product',
              slug: 'test-product',
              image: 'test-image.jpg',
            },
          },
        },
      });

      try {
        const result = await repository.delete(orderId);
        expect(result.success).toBe(true);

        // Verify order and items are deleted
        const deletedOrder = await prisma.order.findUnique({
          where: { id: orderId },
        });
        expect(deletedOrder).toBeNull();

        const deletedItems = await prisma.orderItem.findMany({
          where: { orderId: orderId },
        });
        expect(deletedItems).toHaveLength(0);
      } finally {
        // Cleanup
        await prisma.orderItem.deleteMany({ where: { orderId: orderId } });
        await prisma.order.deleteMany({ where: { id: orderId } });
        await prisma.product.deleteMany({ where: { id: testProductId } });
        await prisma.user.deleteMany({ where: { id: testUserId } });
      }
    });

    it('should return error when trying to delete non-existent order', async () => {
      const nonExistentOrderId = crypto.randomUUID();
      const result = await repository.delete(nonExistentOrderId);
      expect(result.success).toBe(false);
    });
  });
}); 