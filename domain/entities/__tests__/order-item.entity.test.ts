import { OrderItemEntity } from '../order-item.entity';
import { OrderItemDto, ProductDto } from '@/domain/dtos';

describe('OrderItemEntity', () => {
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
    updatedAt: new Date(),
  };

  const mockOrderItemDto: OrderItemDto = {
    id: 'item-1',
    orderId: 'order-1',
    productId: 'product-1',
    quantity: 2,
    price: 100,
    name: 'Test Product',
    slug: 'test-product',
    image: 'test.jpg',
    productDto: mockProductDto,
    createdAt: new Date(),
    updatedAt: new Date(),
    productSnapshot: undefined,
  };

  describe('fromDto', () => {
    it('should create an OrderItemEntity from a valid DTO', () => {
      const result = OrderItemEntity.fromDto(mockOrderItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const orderItem = result.value;
        expect(orderItem).toBeInstanceOf(OrderItemEntity);
        expect(orderItem.toDto()).toEqual(mockOrderItemDto);
      }
    });

    it('should fail when ID is missing', () => {
      const invalidDto = { ...mockOrderItemDto, id: '' };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item DTO must have an id');
      }
    });

    it('should fail when orderId is missing', () => {
      const invalidDto = { ...mockOrderItemDto, orderId: '' };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item must belong to an order');
      }
    });

    it('should fail when productId is missing', () => {
      const invalidDto = { ...mockOrderItemDto, productId: '' };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item must reference a product');
      }
    });

    it('should fail when quantity is invalid', () => {
      const invalidDto = { ...mockOrderItemDto, quantity: 0 };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Quantity must be a positive number');
      }
    });

    it('should fail when price is invalid', () => {
      const invalidDto = { ...mockOrderItemDto, price: 0 };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Price must be a positive number');
      }
    });

    it('should fail when name is missing', () => {
      const invalidDto = { ...mockOrderItemDto, name: '' };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item must have a name');
      }
    });

    it('should fail when slug is missing', () => {
      const invalidDto = { ...mockOrderItemDto, slug: '' };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item must have a slug');
      }
    });

    it('should fail when image is missing', () => {
      const invalidDto = { ...mockOrderItemDto, image: '' };
      const result = OrderItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item must have an image');
      }
    });

    it('should fail when productDto is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { productDto, ...invalidDtoProps } = mockOrderItemDto;
      const invalidDto = invalidDtoProps as Partial<OrderItemDto>;

      const result = OrderItemEntity.fromDto(invalidDto as OrderItemDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Order item must have product data');
      }
    });
  });

  describe('toDto', () => {
    it('should convert entity to DTO', () => {
      const result = OrderItemEntity.fromDto(mockOrderItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const orderItem = result.value;
        const dto = orderItem.toDto();
        expect(dto).toEqual(mockOrderItemDto);
      }
    });
  });

  describe('static create', () => {
    it('should create entity through static create method', () => {
      const result = OrderItemEntity.create(mockOrderItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(OrderItemEntity);
        expect(result.value.id).toBe(mockOrderItemDto.id);
      }
    });
  });

  describe('Business Logic', () => {
    it('should calculate subtotal correctly', () => {
      const result = OrderItemEntity.fromDto(mockOrderItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const orderItem = result.value;
        expect(orderItem.calculateSubtotal()).toBe(200); // 2 items * 100 price
      }
    });

    it('should expose all required properties through getters', () => {
      const result = OrderItemEntity.fromDto(mockOrderItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const orderItem = result.value;
        expect(orderItem.id).toBe('item-1');
        expect(orderItem.orderId).toBe('order-1');
        expect(orderItem.productId).toBe('product-1');
        expect(orderItem.quantity).toBe(2);
        expect(orderItem.price).toBe(100);
        expect(orderItem.name).toBe('Test Product');
        expect(orderItem.slug).toBe('test-product');
        expect(orderItem.image).toBe('test.jpg');
        expect(orderItem.product).toBeDefined();
        expect(orderItem.createdAt).toBeDefined();
        expect(orderItem.updatedAt).toBeDefined();
      }
    });
  });
});
