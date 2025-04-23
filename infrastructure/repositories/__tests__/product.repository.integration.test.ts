import { PrismaClient } from '@prisma/client';
import { ProductRepository } from '../product.repository';
import { ProductEntity } from '@/domain/entities/product.entity';
import { ProductDto } from '@/domain/dtos';
import crypto from 'crypto';

describe('ProductRepository', () => {
  let prisma: PrismaClient;
  let repository: ProductRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    repository = new ProductRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      // Create test product
      const testProductId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
          description: 'Test Description',
          price: 100,
          images: ['test-image.jpg'],
          category: 'test-category',
          brand: 'test-brand',
          stock: 10,
          rating: 4.5,
          numReviews: 10,
          isFeatured: false,
          banner: null,
        },
      });

      try {
        // Act
        const result = await repository.findById(testProductId);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.id).toBe(testProductId);
          expect(result.value.name).toBe(product.name);
          expect(result.value.price).toBe(Number(product.price));
        }
      } finally {
        // Cleanup
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
    });

    it('should return failure when product not found', async () => {
      const nonExistentProductId = crypto.randomUUID();
      const result = await repository.findById(nonExistentProductId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product not found');
      }
    });
  });

  describe('findBySlug', () => {
    it('should return a product when found by slug', async () => {
      // Create test product
      const testProductId = crypto.randomUUID();
      const testSlug = `test-product-${Date.now()}`;
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: testSlug,
          description: 'Test Description',
          price: 100,
          images: ['test-image.jpg'],
          category: 'test-category',
          brand: 'test-brand',
          stock: 10,
          rating: 4.5,
          numReviews: 10,
          isFeatured: false,
          banner: null,
        },
      });

      try {
        // Act
        const result = await repository.findBySlug(testSlug);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.slug).toBe(testSlug);
        }
      } finally {
        // Cleanup
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
    });

    it('should return failure when product not found by slug', async () => {
      const nonExistentSlug = `non-existent-${Date.now()}`;
      const result = await repository.findBySlug(nonExistentSlug);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Product not found');
      }
    });
  });

  describe('save', () => {
    it('should create a new product', async () => {
      // Arrange
      const newProductId = crypto.randomUUID();
      const now = new Date();
      const newProductData = new ProductDto(
        newProductId,
        'New Product',
        `new-product-${Date.now()}`,
        'new-category',
        'new-brand',
        'New Description',
        15,
        ['new-image.jpg'],
        false,
        null,
        150,
        4.0,
        0,
        now
      );

      const newProduct = ProductEntity.fromDto(newProductData);
      if (!newProduct.success) {
        throw newProduct.error;
      }

      try {
        // Act
        const result = await repository.save(newProduct.value);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.id).toBe(newProductData.id);
          expect(result.value.name).toBe(newProductData.name);
          expect(result.value.price).toBe(newProductData.price);
        }

        // Verify in database
        const savedProduct = await prisma.product.findUnique({
          where: { id: newProductData.id },
        });
        expect(savedProduct).not.toBeNull();
        expect(savedProduct?.name).toBe(newProductData.name);
      } finally {
        // Cleanup
        await prisma.product.deleteMany({ where: { id: newProductId } });
      }
    });

    it('should update an existing product', async () => {
      // Create test product
      const testProductId = crypto.randomUUID();
      const now = new Date();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
          description: 'Test Description',
          price: 100,
          images: ['test-image.jpg'],
          category: 'test-category',
          brand: 'test-brand',
          stock: 10,
          rating: 4.5,
          numReviews: 10,
          isFeatured: false,
          banner: null,
        },
      });

      try {
        // Convert to ProductDto format
        const productDto = new ProductDto(
          product.id,
          product.name,
          product.slug,
          product.category,
          product.brand,
          product.description,
          product.stock,
          product.images,
          product.isFeatured,
          product.banner,
          Number(product.price),
          Number(product.rating),
          product.numReviews,
          now
        );

        const testProduct = ProductEntity.fromDto(productDto);
        if (!testProduct.success) {
          throw testProduct.error;
        }

        // Arrange
        const updatedProduct = ProductEntity.fromDto(new ProductDto(
          testProduct.value.id,
          'Updated Product',
          testProduct.value.slug,
          testProduct.value.category,
          testProduct.value.brand,
          testProduct.value.description,
          testProduct.value.stock,
          testProduct.value.images,
          testProduct.value.isFeatured,
          testProduct.value.banner,
          200,
          testProduct.value.rating,
          testProduct.value.numReviews,
          testProduct.value.createdAt
        ));
        if (!updatedProduct.success) {
          throw updatedProduct.error;
        }

        // Act
        const result = await repository.save(updatedProduct.value);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.name).toBe('Updated Product');
          expect(result.value.price).toBe(200);
        }

        // Verify in database
        const savedProduct = await prisma.product.findUnique({
          where: { id: testProductId },
        });
        expect(savedProduct?.name).toBe('Updated Product');
        expect(Number(savedProduct?.price)).toBe(200);
      } finally {
        // Cleanup
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
    });
  });

  describe('delete', () => {
    it('should delete an existing product', async () => {
      // Create test product
      const testProductId = crypto.randomUUID();
      const product = await prisma.product.create({
        data: {
          id: testProductId,
          name: 'Test Product',
          slug: `test-product-${Date.now()}`,
          description: 'Test Description',
          price: 100,
          images: ['test-image.jpg'],
          category: 'test-category',
          brand: 'test-brand',
          stock: 10,
          rating: 4.5,
          numReviews: 10,
          isFeatured: false,
          banner: null,
        },
      });

      try {
        // Act
        const result = await repository.delete(testProductId);

        // Assert
        expect(result.success).toBe(true);

        // Verify in database
        const deletedProduct = await prisma.product.findUnique({
          where: { id: testProductId },
        });
        expect(deletedProduct).toBeNull();
      } finally {
        // Cleanup
        await prisma.product.deleteMany({ where: { id: testProductId } });
      }
    });

    it('should return failure when trying to delete non-existent product', async () => {
      const nonExistentProductId = crypto.randomUUID();
      const result = await repository.delete(nonExistentProductId);
      expect(result.success).toBe(false);
    });
  });
});
