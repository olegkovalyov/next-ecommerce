import { ProductRepository } from '../product.repository';
import { ProductEntity } from '@/domain/entities/product.entity';
import { prisma } from '@/infrastructure/prisma/prisma';
import { ProductDto } from '@/domain/dtos';

// Mock the prisma client
jest.mock('@/infrastructure/prisma/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('ProductRepository', () => {
  let repository: ProductRepository;
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    slug: 'test-product',
    category: 'Test Category',
    brand: 'Test Brand',
    description: 'Test Description',
    price: 100,
    stock: 10,
    images: ['image1.jpg'],
    isFeatured: false,
    banner: null,
    rating: 0,
    numReviews: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repository = new ProductRepository(prisma);
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.findById('1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
      }
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return failure when product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product not found');
      }
    });
  });

  describe('findBySlug', () => {
    it('should return a product when found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.findBySlug('test-product');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
      }
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-product' },
      });
    });

    it('should return failure when product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findBySlug('test-product');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product not found');
      }
    });
  });

  describe('save', () => {
    it('should save a new product', async () => {
      const productDto: ProductDto = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        category: 'Test Category',
        brand: 'Test Brand',
        description: 'Test Description',
        price: 100,
        stock: 10,
        images: ['image1.jpg'],
        isFeatured: false,
        banner: null,
        rating: 0,
        numReviews: 0,
        createdAt: new Date(),
      };

      const productResult = ProductEntity.fromDto(productDto);
      if (!productResult.success) {
        throw new Error('Failed to create product entity');
      }

      (prisma.product.upsert as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.save(productResult.value);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
      }
      expect(prisma.product.upsert).toHaveBeenCalledWith({
        where: { id: '1' },
        create: expect.any(Object),
        update: expect.any(Object),
      });
    });

    it('should return failure when save fails', async () => {
      const productDto: ProductDto = {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        category: 'Test Category',
        brand: 'Test Brand',
        description: 'Test Description',
        price: 100,
        stock: 10,
        images: ['image1.jpg'],
        isFeatured: false,
        banner: null,
        rating: 0,
        numReviews: 0,
        createdAt: new Date(),
      };

      const productResult = ProductEntity.fromDto(productDto);
      if (!productResult.success) {
        throw new Error('Failed to create product entity');
      }

      (prisma.product.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await repository.save(productResult.value);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to save product');
      }
    });
  });

  describe('delete', () => {
    it('should delete a product when found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.delete('1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
      }
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return failure when product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.delete('1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete product');
      }
    });

    it('should return failure when delete operation fails', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await repository.delete('1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to delete product');
      }
    });
  });
});
