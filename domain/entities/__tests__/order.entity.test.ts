import { OrderEntity } from '../order.entity';
import { OrderItemEntity } from '../order-item.entity';
import { OrderDto, OrderItemDto, OrderStatus, ProductDto } from '@/domain/dtos';
import { ShippingAddress } from '@/lib/contracts/shipping-address';

describe('OrderEntity', () => {
  const mockProductDto: ProductDto = {
    id: 'product-1',
    name: 'Test Product',
    slug: 'test-product',
    category: 'test',
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    images: ['test.jpg'],
    isFeatured: false,
    banner: null,
    price: 100,
    rating: 4.5,
    numReviews: 10,
    createdAt: new Date(),
  };

  const mockShippingAddress: ShippingAddress = {
    fullName: 'John Doe',
    streetAddress: '123 Test St',
    city: 'Test City',
    postalCode: '12345',
    country: 'Test Country',
  };

  const createMockOrderItemDto = (productId: string, orderId: string, quantity: number): OrderItemDto => ({
    id: `item-${productId}-${orderId}`,
    orderId: orderId,
    productId: productId,
    quantity: quantity,
    price: mockProductDto.price,
    name: mockProductDto.name,
    slug: mockProductDto.slug,
    image: mockProductDto.images[0],
    productDto: { ...mockProductDto, id: productId },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockOrderDto: OrderDto = {
    id: 'order-1',
    userId: 'user-1',
    shippingAddress: mockShippingAddress,
    paymentMethod: 'credit-card',
    paymentResult: null,
    itemsPrice: 100,
    shippingPrice: 10,
    taxPrice: 5,
    totalPrice: 115,
    status: OrderStatus.PENDING_PAYMENT,
    isPaid: false,
    paidAt: null,
    isDelivered: false,
    deliveredAt: null,
    trackingNumber: null,
    customerNotes: null,
    internalNotes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderItemDtos: [
      createMockOrderItemDto('product-1', 'order-1', 1)
    ],
  };

  describe('fromDto', () => {
    it('should create an OrderEntity from a valid DTO', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        expect(order).toBeInstanceOf(OrderEntity);
        expect(order.id).toBe(mockOrderDto.id);
        expect(order.userId).toBe(mockOrderDto.userId);
        expect(order.shippingAddress).toEqual(mockOrderDto.shippingAddress);
        expect(order.orderItems.size).toBe(1);
      }
    });
    
    it('should fail when order items initialization fails', () => {
      const invalidOrderItemDto = { 
        ...createMockOrderItemDto('product-2', 'order-1', 0), // Invalid quantity
      };
      
      const invalidOrderDto = {
        ...mockOrderDto,
        orderItemDtos: [invalidOrderItemDto]
      };
      
      const result = OrderEntity.fromDto(invalidOrderDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to initialize order item');
      }
    });
  });

  describe('static create', () => {
    it('should create entity through static create method', () => {
      const result = OrderEntity.create(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(OrderEntity);
        expect(result.value.id).toBe(mockOrderDto.id);
      }
    });
  });

  describe('toDto', () => {
    it('should convert entity to DTO', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        const dto = order.toDto();
        
        expect(dto.id).toBe(mockOrderDto.id);
        expect(dto.userId).toBe(mockOrderDto.userId);
        expect(dto.shippingAddress).toEqual(mockOrderDto.shippingAddress);
        expect(dto.paymentMethod).toBe(mockOrderDto.paymentMethod);
        expect(dto.itemsPrice).toBe(mockOrderDto.itemsPrice);
        expect(dto.shippingPrice).toBe(mockOrderDto.shippingPrice);
        expect(dto.taxPrice).toBe(mockOrderDto.taxPrice);
        expect(dto.totalPrice).toBe(mockOrderDto.totalPrice);
        expect(dto.status).toBe(mockOrderDto.status);
        expect(dto.isPaid).toBe(mockOrderDto.isPaid);
        expect(dto.orderItemDtos.length).toBe(1);
      }
    });
  });

  describe('Business Logic', () => {
    it('should calculate items price correctly', () => {
      const orderWithMultipleItems: OrderDto = {
        ...mockOrderDto,
        orderItemDtos: [
          createMockOrderItemDto('product-1', 'order-1', 2),
          createMockOrderItemDto('product-2', 'order-1', 3)
        ]
      };
      
      const result = OrderEntity.fromDto(orderWithMultipleItems);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        expect(order.calculateItemsPrice()).toBe(500); // (2 * 100) + (3 * 100)
      }
    });
    
    it('should calculate total price correctly', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        expect(order.calculateTotalPrice()).toBe(115); // 100 + 10 + 5
      }
    });
    
    it('should add order item', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        const newOrderItemDto = createMockOrderItemDto('product-2', order.id, 1);
        const newOrderItem = OrderItemEntity.fromDto(newOrderItemDto);
        
        expect(newOrderItem.success).toBe(true);
        if (newOrderItem.success) {
          const addResult = order.addOrderItem(newOrderItem.value);
          expect(addResult.success).toBe(true);
          expect(order.orderItems.size).toBe(2);
          expect(order.orderItems.has('product-2')).toBe(true);
        }
      }
    });
    
    it('should fail to add order item with different order id', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        const differentOrderItemDto = createMockOrderItemDto('product-2', 'different-order-id', 1);
        const differentOrderItem = OrderItemEntity.fromDto(differentOrderItemDto);
        
        expect(differentOrderItem.success).toBe(true);
        if (differentOrderItem.success) {
          const addResult = order.addOrderItem(differentOrderItem.value);
          expect(addResult.success).toBe(false);
          if (!addResult.success) {
            expect(addResult.error.message).toBe('Order item belongs to a different order');
          }
        }
      }
    });
    
    it('should remove order item', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        expect(order.orderItems.size).toBe(1);
        
        const removeResult = order.removeOrderItem('product-1');
        expect(removeResult.success).toBe(true);
        expect(order.orderItems.size).toBe(0);
      }
    });
    
    it('should fail to remove non-existent order item', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        
        const removeResult = order.removeOrderItem('non-existent-product');
        expect(removeResult.success).toBe(false);
        if (!removeResult.success) {
          expect(removeResult.error.message).toBe('Order item not found');
        }
      }
    });
    
    it('should mark order as paid', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        expect(order.isPaid).toBe(false);
        
        const paidResult = order.markAsPaid();
        expect(paidResult.success).toBe(true);
        if (paidResult.success) {
          const paidOrder = paidResult.value;
          expect(paidOrder.isPaid).toBe(true);
          expect(paidOrder.paidAt).toBeInstanceOf(Date);
        }
      }
    });
    
    it('should fail to mark already paid order as paid', () => {
      const paidOrderDto = {
        ...mockOrderDto,
        isPaid: true,
        paidAt: new Date()
      };
      
      const result = OrderEntity.fromDto(paidOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const paidOrder = result.value;
        
        const paidResult = paidOrder.markAsPaid();
        expect(paidResult.success).toBe(false);
        if (!paidResult.success) {
          expect(paidResult.error.message).toBe('Order is already marked as paid');
        }
      }
    });
    
    it('should mark order as delivered', () => {
      const paidOrderDto = {
        ...mockOrderDto,
        isPaid: true,
        paidAt: new Date()
      };
      
      const result = OrderEntity.fromDto(paidOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const paidOrder = result.value;
        
        const deliveredResult = paidOrder.markAsDelivered();
        expect(deliveredResult.success).toBe(true);
        if (deliveredResult.success) {
          const deliveredOrder = deliveredResult.value;
          expect(deliveredOrder.isDelivered).toBe(true);
          expect(deliveredOrder.deliveredAt).toBeInstanceOf(Date);
        }
      }
    });
    
    it('should fail to mark unpaid order as delivered', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        
        const deliveredResult = order.markAsDelivered();
        expect(deliveredResult.success).toBe(false);
        if (!deliveredResult.success) {
          expect(deliveredResult.error.message).toBe('Order must be paid before it can be delivered');
        }
      }
    });
    
    it('should fail to mark already delivered order as delivered', () => {
      const deliveredOrderDto = {
        ...mockOrderDto,
        isPaid: true,
        paidAt: new Date(),
        isDelivered: true,
        deliveredAt: new Date()
      };
      
      const result = OrderEntity.fromDto(deliveredOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const deliveredOrder = result.value;
        
        const deliveredResult = deliveredOrder.markAsDelivered();
        expect(deliveredResult.success).toBe(false);
        if (!deliveredResult.success) {
          expect(deliveredResult.error.message).toBe('Order is already marked as delivered');
        }
      }
    });
    
    it('should get order items array', () => {
      const result = OrderEntity.fromDto(mockOrderDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const order = result.value;
        const items = order.getOrderItemsArray();
        
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBe(1);
        expect(items[0]).toBeInstanceOf(OrderItemEntity);
        expect(items[0].productId).toBe('product-1');
      }
    });
  });
}); 