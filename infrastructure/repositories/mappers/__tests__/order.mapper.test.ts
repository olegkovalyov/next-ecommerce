import { OrderMapper } from '../order.mapper';
import { OrderDto } from '@/domain/dtos';
import { Decimal } from '@prisma/client/runtime/library';

describe('OrderMapper', () => {
  describe('toDto', () => {
    it('should convert Order with items to OrderDto', () => {
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

      const result = OrderMapper.toDto(mockOrder);

      expect(result).toEqual({
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
        createdAt: mockOrder.createdAt,
        orderItemDtos: expect.any(Array),
      });
    });
  });

  describe('toPrisma', () => {
    it('should convert OrderDto to Prisma Order data', () => {
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

      const result = OrderMapper.toPrisma(orderDto);

      expect(result).toEqual({
        user: { connect: { id: 'user123' } },
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
      });
    });
  });

  describe('toPrismaWithItems', () => {
    it('should convert OrderDto to Prisma Order data with items', () => {
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

      const result = OrderMapper.toPrismaWithItems(orderDto);

      expect(result.order).toEqual({
        user: { connect: { id: 'user123' } },
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
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        orderId: '123',
        productId: 'product123',
        qty: 2,
        price: 50,
        name: 'Product 1',
        slug: 'product-1',
        image: 'image.jpg',
      });
    });
  });
}); 