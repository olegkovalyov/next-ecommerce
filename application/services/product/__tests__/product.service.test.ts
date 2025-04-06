import { ProductService } from '../product.service';
import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductDto } from '@/domain/dtos/product.dto';
import { ProductRepository } from '@/infrastructure/repositories/product.repository';
import { prisma } from '@/infrastructure/prisma/prisma';

jest.mock('@/infrastructure/repositories/product.repository');
jest.mock('@/infrastructure/prisma/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  const mockProductDto: ProductDto = {
    id: 'product-id',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    brand: 'Test Brand',
    description: 'Test Description',
    stock: 10,
    images: ['test-image.jpg'],
    isFeatured: false,
    banner: null,
    price: 100,
    rating: 4.5,
    numReviews: 100,
    createdAt: new Date(),
  };

  const mockProductEntity = ProductEntity.fromDto(mockProductDto);

  beforeEach(() => {
    jest.clearAllMocks();
    productService = new ProductService();
    mockProductRepository = new ProductRepository(prisma) as jest.Mocked<ProductRepository>;
    (ProductRepository as jest.Mock).mockImplementation(() => mockProductRepository);
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const result = await productService.createProduct(mockProductDto);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('product-id');
        expect(result.value.name).toBe('Test Product');
        expect(result.value.slug).toBe('test-product');
        expect(result.value.category).toBe('Test Category');
        expect(result.value.brand).toBe('Test Brand');
        expect(result.value.description).toBe('Test Description');
        expect(result.value.stock).toBe(10);
        expect(result.value.images).toEqual(['test-image.jpg']);
        expect(result.value.isFeatured).toBe(false);
        expect(result.value.banner).toBeNull();
        expect(result.value.price).toBe(100);
        expect(result.value.rating).toBe(4.5);
        expect(result.value.numReviews).toBe(100);
      }
    });

    it('should return failure when product data is invalid', async () => {
      const invalidProductDto: ProductDto = {
        ...mockProductDto,
        name: '', // Invalid: empty name
      };

      const result = await productService.createProduct(invalidProductDto);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product must have a name');
      }
    });
  });

  describe('saveProduct', () => {
    it('should save a product successfully', async () => {
      if (!mockProductEntity.success) {
        throw new Error('Failed to create mock product entity');
      }

      mockProductRepository.save.mockResolvedValue(mockProductEntity);

      const result = await productService.saveProduct(mockProductEntity.value);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('product-id');
        expect(result.value.name).toBe('Test Product');
      }
      expect(mockProductRepository.save).toHaveBeenCalledWith(mockProductEntity.value);
    });

    it('should return failure when save fails', async () => {
      if (!mockProductEntity.success) {
        throw new Error('Failed to create mock product entity');
      }

      mockProductRepository.save.mockResolvedValue({
        success: false,
        error: new Error('Failed to save product'),
      });

      const result = await productService.saveProduct(mockProductEntity.value);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save product');
      }
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      if (!mockProductEntity.success) {
        throw new Error('Failed to create mock product entity');
      }

      mockProductRepository.delete.mockResolvedValue(mockProductEntity);

      const result = await productService.deleteProduct('product-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('product-id');
      }
      expect(mockProductRepository.delete).toHaveBeenCalledWith('product-id');
    });

    it('should return failure when delete fails', async () => {
      mockProductRepository.delete.mockResolvedValue({
        success: false,
        error: new Error('Failed to delete product'),
      });

      const result = await productService.deleteProduct('product-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete product');
      }
    });
  });

  describe('loadProductById', () => {
    it('should load a product successfully', async () => {
      if (!mockProductEntity.success) {
        throw new Error('Failed to create mock product entity');
      }

      mockProductRepository.findById.mockResolvedValue(mockProductEntity);

      const result = await productService.loadProductById('product-id');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.id).toBe('product-id');
        expect(result.value.name).toBe('Test Product');
      }
      expect(mockProductRepository.findById).toHaveBeenCalledWith('product-id');
    });

    it('should return failure when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue({
        success: false,
        error: new Error('Product not found'),
      });

      const result = await productService.loadProductById('non-existent-id');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product not found');
      }
    });
  });
});
