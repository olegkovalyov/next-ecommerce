import { CartItemEntity } from '../cart-item.entity';
import { CartItemDto, ProductDto } from '@/domain/dtos';

describe('CartItemEntity', () => {
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

  const mockCartItemDto: CartItemDto = {
    id: 'item-1',
    cartId: 'cart-1',
    productId: 'product-1',
    quantity: 2,
    productDto: mockProductDto,
  };

  describe('fromDto', () => {
    it('should create a CartItemEntity from a valid DTO', () => {
      const result = CartItemEntity.fromDto(mockCartItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cartItem = result.value;
        expect(cartItem).toBeInstanceOf(CartItemEntity);
        expect(cartItem.toDto()).toEqual(mockCartItemDto);
      }
    });

    it('should fail when ID is missing', () => {
      const invalidDto = { ...mockCartItemDto, id: '' };
      const result = CartItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart item must have an ID');
      }
    });

    it('should fail when cartId is missing', () => {
      const invalidDto = { ...mockCartItemDto, cartId: '' };
      const result = CartItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart item must belong to a cart');
      }
    });

    it('should fail when productId is missing', () => {
      const invalidDto = { ...mockCartItemDto, productId: '' };
      const result = CartItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart item must reference a product');
      }
    });

    it('should fail when quantity is invalid', () => {
      const invalidDto = { ...mockCartItemDto, quantity: 0 };
      const result = CartItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Quantity must be a positive number');
      }
    });

    it('should fail when productDto is missing', () => {
      const invalidDto = { ...mockCartItemDto, productDto: undefined };
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const result = CartItemEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Cart item must have product data');
      }
    });
  });

  describe('toDto', () => {
    it('should convert entity to DTO', () => {
      const result = CartItemEntity.fromDto(mockCartItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cartItem = result.value;
        const dto = cartItem.toDto();
        expect(dto).toEqual(mockCartItemDto);
      }
    });
  });

  describe('Business Logic', () => {
    it('should update quantity correctly', () => {
      const result = CartItemEntity.fromDto(mockCartItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cartItem = result.value;
        cartItem.updateQuantity(3);
        expect(cartItem.quantity).toBe(3);
      }
    });

    it('should throw error when updating to invalid quantity', () => {
      const result = CartItemEntity.fromDto(mockCartItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cartItem = result.value;
        expect(() => cartItem.updateQuantity(0)).toThrow('Quantity must be a positive number');
      }
    });

    it('should throw error when updating to quantity exceeding stock', () => {
      const result = CartItemEntity.fromDto(mockCartItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cartItem = result.value;
        expect(() => cartItem.updateQuantity(11)).toThrow('Not enough stock available. Only 10 items left.');
      }
    });

    it('should calculate subtotal correctly', () => {
      const result = CartItemEntity.fromDto(mockCartItemDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const cartItem = result.value;
        expect(cartItem.calculateSubtotal()).toBe(200); // 2 items * 100 price
      }
    });
  });
});
