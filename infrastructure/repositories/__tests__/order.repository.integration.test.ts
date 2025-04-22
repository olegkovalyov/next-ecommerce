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
  let testUserId: string;
  let testProductId: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new OrderRepository(prisma);

    // Create test user
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password',
      },
    });
    testUserId = user.id;

    // Create test product with a unique slug
    const uniqueId = crypto.randomUUID();
    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        slug: `test-product-${uniqueId}`,
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
    testProductId = product.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up order items before each test
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();

    // Create test product if it doesn't exist
    const existingProduct = await prisma.product.findUnique({
      where: { id: testProductId },
    });

    if (!existingProduct) {
      const uniqueId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${uniqueId}`,
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
      testProductId = product.id;
    }
  });

  describe('findByUserId', () => {
    it('should return empty array when no orders exist', async () => {
      const result = await repository.findByUserId(testUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should return orders when they exist', async () => {
      // Create test order
      const order = await prisma.order.create({
        data: {
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

      const result = await repository.findByUserId(testUserId);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toBeInstanceOf(OrderEntity);
        expect(result.value[0].id).toBe(order.id);
      }
    });
  });

  describe('save', () => {
    it('should create new order', async () => {
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
    });

    it('should update existing order with items', async () => {
      // Create initial order
      const order = await prisma.order.create({
        data: {
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

      const productDto = new ProductDto(
        testProductId,
        'Test Product',
        'test-product',
        'Test Category',
        'Test Brand',
        'Test Description',
        10,
        ['test-image.jpg'],
        false,
        null,
        100,
        4.5,
        0,
        new Date()
      );

      const orderItemDto = new OrderItemDto(
        order.id,
        testProductId,
        2,
        100,
        'Test Product',
        'test-product',
        'test-image.jpg',
        productDto
      );

      const orderDto = new OrderDto(
        order.id,
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
        expect(result.value.id).toBe(order.id);
        const orderItems = result.value.getOrderItemsArray();
        expect(orderItems).toHaveLength(1);
        expect(orderItems[0].productId).toBe(testProductId);
        expect(orderItems[0].qty).toBe(2);
      }
    });
  });

  describe('delete', () => {
    it('should delete order and its items', async () => {
      // Create test order with items
      const order = await prisma.order.create({
        data: {
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

      const result = await repository.delete(order.id);
      expect(result.success).toBe(true);

      // Verify order is deleted
      const deletedOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(deletedOrder).toBeNull();

      // Verify order items are deleted
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });
      expect(orderItems).toHaveLength(0);
    });
  });
}); 