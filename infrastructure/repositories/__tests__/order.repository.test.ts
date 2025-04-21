import { OrderRepository } from '../order.repository';
import { OrderEntity } from '@/domain/entities/order.entity';
import { OrderDto } from '@/domain/dtos';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        order: {
          findUniqueOrThrow: jest.fn(),
          findMany: jest.fn(),
          upsert: jest.fn(),
          delete: jest.fn(),
        },
      };
    }),
  };
});

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    repository = new OrderRepository(prisma);
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      const mockOrder = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: new Decimal(100),
        shippingPrice: new Decimal(10),
        taxPrice: new Decimal(5),
        totalPrice: new Decimal(115),
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        OrderItem: [
          {
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: new Decimal(50),
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            product: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: new Decimal(50),
              rating: new Decimal(4.5),
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrder);

      const result = await repository.findById('123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(OrderEntity);
        expect(result.value.id).toBe('123');
      }
    });

    it('should return failure when order not found', async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await repository.findById('123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order not found');
      }
    });

    it('should handle errors gracefully', async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await repository.findById('123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order not found');
      }
    });
  });

  describe('findByUserId', () => {
    it('should return orders when found', async () => {
      const mockOrders = [
        {
          id: '123',
          userId: 'user123',
          shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
          paymentMethod: 'PayPal',
          paymentResult: null,
          itemsPrice: new Decimal(100),
          shippingPrice: new Decimal(10),
          taxPrice: new Decimal(5),
          totalPrice: new Decimal(115),
          isPaid: false,
          paidAt: null,
          isDelivered: false,
          deliveredAt: null,
          createdAt: new Date(),
          OrderItem: [
            {
              orderId: '123',
              productId: 'product123',
              qty: 2,
              price: new Decimal(50),
              name: 'Product 1',
              slug: 'product-1',
              image: 'image.jpg',
              product: {
                id: 'product123',
                name: 'Product 1',
                slug: 'product-1',
                category: 'Category',
                images: ['image.jpg'],
                brand: 'Brand',
                description: 'Description',
                stock: 10,
                price: new Decimal(50),
                rating: new Decimal(4.5),
                numReviews: 10,
                isFeatured: true,
                banner: null,
                createdAt: new Date(),
              },
            },
          ],
        },
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await repository.findByUserId('user123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toBeInstanceOf(OrderEntity);
        expect(result.value[0].id).toBe('123');
      }
    });

    it('should return failure when orders not found', async () => {
      (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await repository.findByUserId('user123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to find orders');
      }
    });

    it('should handle errors gracefully', async () => {
      (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await repository.findByUserId('user123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to find orders');
      }
    });
  });

  describe('save', () => {
    it('should save new order successfully', async () => {
      const orderDto: OrderDto = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: 100,
        shippingPrice: 10,
        taxPrice: 5,
        totalPrice: 115,
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        orderItemDtos: [
          {
            id: 'item123',
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: 50,
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            productDto: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: 50,
              rating: 4.5,
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      const orderEntityResult = OrderEntity.fromDto(orderDto);
      if (!orderEntityResult.success) {
        throw new Error('Failed to create order entity for test');
      }
      const orderEntity = orderEntityResult.value;
      
      const mockSavedOrder = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: new Decimal(100),
        shippingPrice: new Decimal(10),
        taxPrice: new Decimal(5),
        totalPrice: new Decimal(115),
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        OrderItem: [
          {
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: new Decimal(50),
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            product: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: new Decimal(50),
              rating: new Decimal(4.5),
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      (prisma.order.upsert as jest.Mock).mockResolvedValue(mockSavedOrder);

      const result = await repository.save(orderEntity);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(OrderEntity);
        expect(result.value.id).toBe('123');
      }
    });

    it('should return failure when save fails', async () => {
      const orderDto: OrderDto = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: 100,
        shippingPrice: 10,
        taxPrice: 5,
        totalPrice: 115,
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        orderItemDtos: [
          {
            id: 'item123',
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: 50,
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            productDto: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: 50,
              rating: 4.5,
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      const orderEntityResult = OrderEntity.fromDto(orderDto);
      if (!orderEntityResult.success) {
        throw new Error('Failed to create order entity for test');
      }
      const orderEntity = orderEntityResult.value;

      (prisma.order.upsert as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const result = await repository.save(orderEntity);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save order');
      }
    });

    it('should handle errors gracefully', async () => {
      const orderDto: OrderDto = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: 100,
        shippingPrice: 10,
        taxPrice: 5,
        totalPrice: 115,
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        orderItemDtos: [
          {
            id: 'item123',
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: 50,
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            productDto: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: 50,
              rating: 4.5,
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      const orderEntityResult = OrderEntity.fromDto(orderDto);
      if (!orderEntityResult.success) {
        throw new Error('Failed to create order entity for test');
      }
      const orderEntity = orderEntityResult.value;

      (prisma.order.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await repository.save(orderEntity);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save order');
      }
    });
  });

  describe('delete', () => {
    it('should delete order successfully', async () => {
      const mockOrder = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: new Decimal(100),
        shippingPrice: new Decimal(10),
        taxPrice: new Decimal(5),
        totalPrice: new Decimal(115),
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        OrderItem: [
          {
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: new Decimal(50),
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            product: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: new Decimal(50),
              rating: new Decimal(4.5),
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.delete as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete('123');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(OrderEntity);
        expect(result.value.id).toBe('123');
      }
      expect(prisma.order.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          OrderItem: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(prisma.order.delete).toHaveBeenCalledWith({
        where: { id: '123' },
      });
    });

    it('should return failure when order not found', async () => {
      (prisma.order.findUniqueOrThrow as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await repository.delete('123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete order');
      }
    });

    it('should handle errors gracefully when delete fails', async () => {
      const mockOrder = {
        id: '123',
        userId: 'user123',
        shippingAddress: { fullName: 'John Doe', address: '123 Main St', city: 'New York', postalCode: '10001', country: 'USA' },
        paymentMethod: 'PayPal',
        paymentResult: null,
        itemsPrice: new Decimal(100),
        shippingPrice: new Decimal(10),
        taxPrice: new Decimal(5),
        totalPrice: new Decimal(115),
        isPaid: false,
        paidAt: null,
        isDelivered: false,
        deliveredAt: null,
        createdAt: new Date(),
        OrderItem: [
          {
            orderId: '123',
            productId: 'product123',
            qty: 2,
            price: new Decimal(50),
            name: 'Product 1',
            slug: 'product-1',
            image: 'image.jpg',
            product: {
              id: 'product123',
              name: 'Product 1',
              slug: 'product-1',
              category: 'Category',
              images: ['image.jpg'],
              brand: 'Brand',
              description: 'Description',
              stock: 10,
              price: new Decimal(50),
              rating: new Decimal(4.5),
              numReviews: 10,
              isFeatured: true,
              banner: null,
              createdAt: new Date(),
            },
          },
        ],
      };

      (prisma.order.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      const result = await repository.delete('123');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete order');
      }
    });
  });
}); 