import { ProductEntity } from '../product.entity';
import { ProductDto } from '@/domain/dtos';

describe('ProductEntity', () => {
  const mockProductDto: ProductDto = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    images: ['image1.jpg'],
    isFeatured: false,
    banner: null,
    price: 100,
    rating: 4.5,
    numReviews: 10,
    createdAt: new Date(),
  };

  describe('fromDto', () => {
    it('should create a ProductEntity from a valid DTO', () => {
      const result = ProductEntity.fromDto(mockProductDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const product = result.value;
        expect(product).toBeInstanceOf(ProductEntity);
        expect(product.toDto()).toEqual(mockProductDto);
      }
    });

    it('should fail when ID is missing', () => {
      const invalidDto = { ...mockProductDto, id: '' };
      const result = ProductEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product must have an ID');
      }
    });

    it('should fail when name is missing', () => {
      const invalidDto = { ...mockProductDto, name: '' };
      const result = ProductEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product must have a name');
      }
    });

    it('should fail when stock is negative', () => {
      const invalidDto = { ...mockProductDto, stock: -1 };
      const result = ProductEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Stock cannot be negative');
      }
    });

    it('should fail when price is negative', () => {
      const invalidDto = { ...mockProductDto, price: -1 };
      const result = ProductEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Price cannot be negative');
      }
    });

    it('should fail when rating is invalid', () => {
      const invalidDto = { ...mockProductDto, rating: 6 };
      const result = ProductEntity.fromDto(invalidDto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Rating must be between 0 and 5');
      }
    });
  });

  describe('toDto', () => {
    it('should convert entity to DTO', () => {
      const result = ProductEntity.fromDto(mockProductDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const product = result.value;
        const dto = product.toDto();
        expect(dto).toEqual(mockProductDto);
      }
    });
  });

  describe('Business Logic', () => {
    it('should check if product has enough stock', () => {
      const result = ProductEntity.fromDto(mockProductDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const product = result.value;
        expect(product.hasEnoughStock(5)).toBe(true);
        expect(product.hasEnoughStock(15)).toBe(false);
      }
    });

    it('should calculate total price correctly', () => {
      const result = ProductEntity.fromDto(mockProductDto);
      expect(result.success).toBe(true);
      if (result.success) {
        const product = result.value;
        expect(product.calculateTotalPrice(2)).toBe(200);
        expect(product.calculateTotalPrice(0)).toBe(0);
      }
    });
  });
});
