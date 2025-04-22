import { PrismaClient } from '@prisma/client';
import { ProductRepository } from '../product.repository';
import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductDto } from '@/domain/dtos/product.dto';
import crypto from 'crypto';

describe('ProductRepository Integration Tests', () => {
  let prisma: PrismaClient;
  let repository: ProductRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new ProductRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up products before each test
    await prisma.cartItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.product.deleteMany();
  });

  describe('findById', () => {
    it('should return null when product does not exist', async () => {
      const result = await repository.findById('00000000-0000-0000-0000-000000000000');
      expect(result.success).toBe(false);
    });

    it('should return product when it exists', async () => {
      // Create test product
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
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

      const result = await repository.findById(product.id);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
        expect(result.value?.id).toBe(product.id);
        expect(result.value?.name).toBe('Test Product');
        expect(result.value?.slug).toBe(product.slug);
        expect(result.value?.category).toBe('Test Category');
        expect(result.value?.brand).toBe('Test Brand');
        expect(result.value?.description).toBe('Test Description');
        expect(result.value?.stock).toBe(10);
        expect(result.value?.images).toEqual(['test-image.jpg']);
        expect(result.value?.price).toBe(100);
        expect(result.value?.rating).toBe(4.5);
        expect(result.value?.numReviews).toBe(0);
      }
    });
  });

  describe('findBySlug', () => {
    it('should return null when product does not exist', async () => {
      const result = await repository.findBySlug('non-existent-slug');
      expect(result.success).toBe(false);
    });

    it('should return product when it exists', async () => {
      // Create test product
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
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

      const result = await repository.findBySlug(product.slug);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
        expect(result.value?.id).toBe(product.id);
        expect(result.value?.slug).toBe(product.slug);
      }
    });
  });

  describe('save', () => {
    it('should create new product', async () => {
      const productDto = new ProductDto(
        crypto.randomUUID(),
        'Test Product',
        `test-product-${Date.now()}`,
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

      const productEntity = ProductEntity.fromDto(productDto);
      if (!productEntity.success) {
        throw new Error('Failed to create product entity');
      }

      const result = await repository.save(productEntity.value);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
        expect(result.value.id).toBeTruthy();
        expect(result.value.name).toBe('Test Product');
        expect(result.value.slug).toBe(productDto.slug);
        expect(result.value.category).toBe('Test Category');
        expect(result.value.brand).toBe('Test Brand');
        expect(result.value.description).toBe('Test Description');
        expect(result.value.stock).toBe(10);
        expect(result.value.images).toEqual(['test-image.jpg']);
        expect(result.value.price).toBe(100);
        expect(result.value.rating).toBe(4.5);
        expect(result.value.numReviews).toBe(0);
      }
    });

    it('should update existing product', async () => {
      // Create initial product
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
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

      const productDto = new ProductDto(
        product.id,
        'Updated Product',
        product.slug,
        'Updated Category',
        'Updated Brand',
        'Updated Description',
        20,
        ['updated-image.jpg'],
        true,
        'banner.jpg',
        200,
        4.8,
        5,
        new Date()
      );

      const productEntity = ProductEntity.fromDto(productDto);
      if (!productEntity.success) {
        throw new Error('Failed to create product entity');
      }

      const result = await repository.save(productEntity.value);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(ProductEntity);
        expect(result.value.id).toBe(product.id);
        expect(result.value.name).toBe('Updated Product');
        expect(result.value.slug).toBe(product.slug);
        expect(result.value.category).toBe('Updated Category');
        expect(result.value.brand).toBe('Updated Brand');
        expect(result.value.description).toBe('Updated Description');
        expect(result.value.stock).toBe(20);
        expect(result.value.images).toEqual(['updated-image.jpg']);
        expect(result.value.price).toBe(200);
        expect(result.value.rating).toBe(4.8);
        expect(result.value.numReviews).toBe(5);
        expect(result.value.isFeatured).toBe(true);
        expect(result.value.banner).toBe('banner.jpg');
      }
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      // Create test product
      const product = await prisma.product.create({
        data: {
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
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

      const result = await repository.delete(product.id);
      expect(result.success).toBe(true);

      // Verify product is deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(deletedProduct).toBeNull();
    });
  });
});
